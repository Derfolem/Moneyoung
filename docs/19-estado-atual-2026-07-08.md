# Estado Atual — 2026-07-08 (continuacao da sessao de 2026-07-06)

## Resumo

Continuacao direta da sessao registrada em `18-estado-atual-2026-07-06.md`. Foco: destravar o build Android via EAS, que falhou repetidas vezes por causa de dependencias com versoes incompativeis com o Expo SDK 51. Ver tambem `00-checklist-mvp.md` (item 2.9).

## Como retomar se a sessao cair

O **build do EAS roda 100% na nuvem da Expo**, independente desta conversa ou desta maquina. Se a sessao for interrompida, o build nao e perdido nem volta pra fila — ele continua rodando/esperando normalmente do lado da Expo. So se perde o monitoramento automatico local.

**Para checar o status de um build manualmente:**
```bash
cd apps/mobile
set -a && source ../../.env && set +a
npx eas-cli build:view <BUILD_ID>
```

**Build em andamento no momento deste registro:** ID `c4452bef-ec4c-40a1-a7f7-bafd802a950a`, disparado em 08/07/2026 07:39, commit `ce5ebfe`. Ver secao "Build #4" abaixo.

## A saga do build Android — 4 tentativas

### Build #1 — `ad98e925` (commit `6e5e457`) — ERRORED

Causa: `apps/mobile/package.json` tinha `expo-dev-client@^56.0.20` e `expo-font@^56.0.7` — versoes completamente incompativeis com o Expo SDK 51 (deveriam ser `~4.0.29` e `~12.0.10`). Alem disso, a pasta `apps/mobile/android/` (nativa) estava commitada no git desde um teste local antigo (`expo run:android`), e por existir, fazia o EAS **pular** a regeneracao automatica via Prebuild/CNG, compilando com plugins Gradle desalinhados com as dependencias atuais.

**Fix aplicado (commit `4944526`):**
- Corrigidas as versoes no `apps/mobile/package.json` (expo-dev-client, expo-font, async-storage, typescript)
- Removida a pasta `apps/mobile/android/` do git (era so boilerplate padrao do Expo, sem codigo nativo customizado — conferido antes de apagar) e adicionada ao `.gitignore` (junto com `ios/`)
- Fallback fixo para `extra.eas.projectId` no `app.config.ts`, ja que o build remoto nao tinha acesso ao `EAS_PROJECT_ID` do `.env` local (nao commitado)

### Build #2 — `8411bd96` (commit `4944526`) — ERRORED

Mesma falha (`expo-font@56.0.7` instalado), apesar da correcao acima. Causa: um `npm install` incremental anterior tinha preservado uma resolucao **aninhada** antiga de `expo-font@56.0.7` em `apps/mobile/node_modules/`, mesmo com o `package.json` corrigido — porque o `package-lock.json` ja existente tinha essa entrada gravada e o `npm install` normal e conservador (nao reprocessa tudo do zero).

**Fix aplicado (commit `69e9ed0`):** apagar `node_modules/` **e** `package-lock.json` e rodar `npm install` do zero, forcando resolucao completa. Confirmado localmente: uma unica copia de `expo-font@12.0.10`, sem duplicata aninhada.

### Build #3 — `0f49751e` (commit `69e9ed0`) — ERRORED

Progresso: o problema do `expo-font`/`expo-dev-client` sumiu. Novo problema: `expo-modules-autolinking@57.0.4` instalado, mas o `expo-doctor` esperava `~1.11.0`. Causa raiz: `expo-modules-autolinking` e uma dependencia **transitiva** (peer dependency solta, `>=0.8.1`) de `@expo/prebuild-config` (via `@expo/cli`) — como o registro npm, nesta linha do tempo do projeto, ja tem versoes de `expo-modules-autolinking` bem mais novas publicadas como "latest" (57.x), o npm resolve a peer dependency solta para a mais recente em vez da compativel com o SDK 51.

**Investigacao adicional:** rodada uma varredura completa comparando **todas** as dependencias instaladas contra o manifesto oficial `node_modules/expo/bundledNativeModules.json` (lista de versoes esperadas pelo SDK 51), pra achar de uma vez todos os pacotes "adiantados" em vez de descobrir um por um a cada ~1h de fila do EAS. Resultado: alem do `expo-modules-autolinking`, tambem `expo-constants` (57.0.3 instalado vs `~16.0.2` esperado) e `react-native-safe-area-context` (5.8.0 vs `4.10.5` esperado) estavam com o mesmo problema.

**Fix aplicado (commit `ce5ebfe`):** adicionados `overrides` no `package.json` raiz para forcar essas 3 versoes (`expo-constants`, `expo-modules-autolinking`, `react-native-safe-area-context`), com `node_modules/` + `package-lock.json` apagados e reinstalados do zero de novo. Confirmado: 0 divergencias na varredura completa contra o `bundledNativeModules.json`.

### Build #4 — `c4452bef` (commit `ce5ebfe`) — **FINISHED (sucesso)**

Disparado em 08/07/2026 07:39, terminou 07:58 (~19 min de compilacao apos sair da fila). Com todas as versoes corrigidas de uma vez (varredura completa, nao so as que ja tinham aparecido em builds anteriores), o build passou do Gradle sem problemas.

**APK gerado:** https://expo.dev/artifacts/eas/zDnSgNk3BX3aFU8FhJuf4I2Z16TyldXf3MIi1LKFCqg.apk

**Teste em dispositivo fisico:** ainda pendente — Fred nao possui celular Android fisico. Alternativas: emulador Android Studio no PC (nao roda em iPhone/iOS, sistema incompativel) ou instalar o APK diretamente pelo link acima num Android emprestado.

## Licoes aprendidas (para nao repetir)

1. **Nunca usar so `npm install` incremental depois de corrigir uma versao errada em `package.json`** — pode sobrar resolucao aninhada antiga no `package-lock.json`. Sempre apagar `node_modules/` + `package-lock.json` e reinstalar do zero quando se corrige uma versao de dependencia nativa do Expo.
2. **Antes de disparar outro build caro (~30-90 min de fila no plano free do EAS), rodar a varredura completa contra `bundledNativeModules.json`** em vez de corrigir um pacote por vez:
   ```bash
   python3 -c "
   import json
   bundled = json.load(open('node_modules/expo/bundledNativeModules.json'))
   lock = json.load(open('package-lock.json'))
   pkgs = lock.get('packages', {})
   def major(v):
       try: return int(v.split('.')[0])
       except: return None
   for name, expected in bundled.items():
       exp_major = major(expected.lstrip('~^'))
       for path, meta in pkgs.items():
           if path.endswith('node_modules/' + name):
               v = meta.get('version')
               if v and major(v) != exp_major:
                   print(f'{name}: expected {expected}, installed {v} ({path})')
   "
   ```
3. **`apps/mobile/android/` e `apps/mobile/ios/` nunca devem ser commitados** — o projeto usa managed workflow (CNG/Prebuild), essas pastas sao geradas automaticamente pelo EAS a cada build a partir do `app.config.ts`. Ja estao no `.gitignore`.
4. **Monitor de build precisa aceitar status em MAIUSCULO** (`ERRORED`, nao `errored`) — bug que fez eu nao perceber a primeira falha por mais de uma hora. Ja corrigido nos scripts de monitoramento subsequentes.
5. **Builds no plano free do EAS podem ficar mais de 1h so na fila** — nao e sinal de problema, e so a fila compartilhada gratuita.

## Como investigar um build que falhou

```bash
cd apps/mobile
set -a && source ../../.env && set +a
BUILD_ID="<id>"
npx eas-cli build:view "$BUILD_ID" --json > /tmp/build.json
python3 -c "import json; d=json.load(open('/tmp/build.json')); print(d['error']); print(d['logFiles'][0])"
# baixar e descomprimir o log (formato brotli):
curl -s "<logFiles[0]>" -o /tmp/log.txt
python3 -c "
import brotli
data = open('/tmp/log.txt','rb').read()
open('/tmp/log_decoded.txt','wb').write(brotli.decompress(data))
"
# procurar a fase que falhou:
python3 -c "
import json
for l in open('/tmp/log_decoded.txt'):
    try:
        d = json.loads(l)
        if d.get('phase') in ('RUN_EXPO_DOCTOR','RUN_GRADLEW','PREBUILD'):
            print(f\"[{d['phase']}]\", d.get('msg',''))
    except Exception:
        pass
"
```
(precisa do pacote `brotli` do Python: `pip install brotli`)

## Checklist atualizado

- 2.9 "Gerar APK preview" → marcado como concluido (build #4, sucesso)

## Proximos passos

1. Testar o APK em dispositivo fisico Android (Fred nao tem — usar emulador Android Studio no PC ou pedir device emprestado) e testar login Google + QR code + fluxo completo de transferencia
2. Gerar APK/AAB de producao e publicar na Google Play Store
3. Sign in with Apple (2.10.2) — obrigatorio pela Apple para apps com login Google
4. Conteudo completo da landing page (hoje e so o logo)
5. Reteste do fluxo de dados reais (item 4.2)

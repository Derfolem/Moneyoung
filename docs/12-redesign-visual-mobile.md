# Redesign Visual Mobile - Demo para Investidores

Data: 2026-06-17

## Objetivo

Redesign completo da interface mobile YoungCoin para apresentacao a investidores. Todas as telas seguem os mockups aprovados com identidade visual fintech dark navy blue. Este redesign e SOMENTE VISUAL. A parte funcional (Supabase real, OAuth, Edge Functions) sera implementada em fase posterior.

## Modo demo

O app continua funcionando integralmente sem Supabase configurado. O modo demo usa dados locais em memoria com perfil e transacoes realistas para a apresentacao.

## Paleta de cores

| Token | Cor | Uso |
|---|---|---|
| ink | #0D1B2A | Texto principal, navy escuro |
| muted | #64748B | Texto secundario, slate |
| border | #E2E8F0 | Bordas, divisores |
| surface | #FFFFFF | Fundo de cards |
| background | #F0F4F8 | Fundo de pagina |
| primary | #2563EB | Botoes CTA, azul vivo |
| primaryDark | #1B3A5C | Card de saldo, headers escuros |
| accent | #3B82F6 | Links, destaques |
| warning | #F59E0B | Alertas |
| danger | #EF4444 | Erros, saidas de valor |
| navyDeep | #0A1628 | Splash, headers escuros |
| success | #22C55E | Entradas de valor |
| cardShadow | rgba(13,27,42,0.08) | Sombra de cards |

## Componentes criados

### HexLogo (src/components/HexLogo.tsx)

Logo hexagonal YC usando react-native-svg. Props: size, color, textColor. Usado nas telas de login, home, receive e receipt.

## Componentes alterados

### Screen

- Adicionada prop `darkMode` (fundo navyDeep)
- Adicionada prop `statusBarStyle` (claro/escuro)
- Padding e gap aumentados para mais respiro

### Button

- Novo borderRadius 12
- Primary agora azul (#2563EB)
- Secondary com fundo claro e borda
- Novo tone `ghost` (transparente)

### PageHeader

- Back button agora circular com icone Ionicons
- Prop `darkHeader` para telas com fundo escuro

### TransactionRow

- Removida borda, adicionada sombra
- Circulo colorido com icone de seta (verde/vermelho)
- borderRadius aumentado para 12

## Telas alteradas

### Login

- Fundo navy escuro completo
- HexLogo grande centralizado (120px)
- "YOUNGCOIN" + "A MOEDA DA EDUCACAO"
- Campos visuais de email e senha
- Botao azul "Entrar"

### Home

- Header com saudacao contextual (Bom dia/Boa tarde/Boa noite)
- Avatar com iniciais e icone de notificacoes
- Card de saldo navy com HexLogo sutil
- Grid de 4 acoes com icones circulares
- Secao "Ultimas transacoes" com link "Ver tudo"

### Transfer

- Valor grande centralizado (fontSize 48)
- Inputs com fundo cinza sem borda
- Navega para tela de confirmacao em vez de Alert

### Receive

- Fundo escuro (darkMode)
- QR code maior (280x280) com HexLogo sobreposto
- Young key em branco
- Botao copiar estilizado

### Pay

- Overlay semi-transparente no scanner
- Moldura com cantos azuis na area de scan
- Texto instrucional abaixo do scanner
- Inputs restyled

### Statement

- Filtros como pills arredondados (ativo=azul, inativo=cinza)

### Profile

- Header curvo navy escuro com avatar grande e nome branco
- Lista de informacoes com icones coloridos
- Botao sair como texto vermelho com icone

## Telas novas

### Transfer Confirm (app/transfer-confirm.tsx)

Tela de confirmacao antes de executar transferencia. Mostra card com valor, destinatario e descricao. Botoes "Confirmar transferencia" e "Cancelar". Navega para comprovante apos sucesso.

### Receipt (app/receipt.tsx)

Comprovante de transacao. Header navy com HexLogo watermark. Card branco sobreposto com valor, data, origem, destino, descricao e status. Botoes "Compartilhar" (decorativo) e "Voltar ao inicio".

### Notifications (app/notifications.tsx)

Lista de notificacoes demo com 3 itens hardcoded: transferencia recebida, boas-vindas e credito inicial. Icones coloridos e timestamps.

## Dados demo atualizados

- Saldo: 5.000 YC (era 250)
- Nome: Miguel Aires (era Usuario Demo)
- Young Key: @miguel.aires (era @demo)
- Email: miguel@youngcoin.edu.br
- 5 transacoes variadas: premio hackathon, cantina escolar, material didatico, mesada educacional, credito inicial

## Navegacao

```
login -> home
home -> transfer | pay | receive | statement | profile | notifications
transfer -> transfer-confirm (nova)
transfer-confirm -> receipt (nova)
receipt -> home
notifications -> home (back)
```

## Como testar

```bash
cd ~/APPs/Fagner/ycbank/apps/mobile
EXPO_USE_METRO_WORKSPACE_ROOT=1 npx expo start --web
```

Abrir http://localhost:8081. Com .env vazio, o app entra automaticamente em modo demo.

## Proximos passos (parte funcional)

1. Configurar projeto Supabase e preencher .env
2. Rodar migrations e Edge Functions
3. Testar login Google real
4. Conectar todas as telas ao backend real
5. Implementar notificacoes reais (push notifications)
6. Implementar compartilhamento real no comprovante

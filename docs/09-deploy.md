# Deploy

## Supabase

Estado em 2026-06-16: Supabase ainda nao esta configurado no `.env`. O app mobile web funciona em modo demo local, mas OAuth, profiles, wallets e ledger real dependem desta etapa.

1. Crie projeto Supabase.
2. Configure Google OAuth em Authentication Providers.
3. Adicione redirect URLs do mobile, web e Supabase.
4. Rode migrations:

```bash
npm run supabase:migrate
```

5. Faça deploy das funcoes:

```bash
npx supabase functions deploy create_profile_on_first_login
npx supabase functions deploy transfer_youngcoin
npx supabase functions deploy get_wallet_summary
npx supabase functions deploy reverse_transaction
npx supabase functions deploy block_wallet
npx supabase functions deploy create_organization_account
npx supabase functions deploy admin_dashboard_summary
```

## Vercel

Configure as variaveis publicas Supabase e publique `apps/web-admin`.

## EAS Android

Para desenvolvimento local Android nesta maquina, primeiro abra o emulador com o wrapper:

```bash
~/Android/emulator-compat -avd Pixel_6_API_34
```

Depois rode:

```bash
cd apps/mobile
npx expo run:android
```

O wrapper e necessario porque o sistema tem GLIBC 2.28 e o Android Emulator instalado exige GLIBC 2.29/2.30. As bibliotecas compat ficam fora do repo em `~/glibc-compat`.

```bash
npm run build:android:preview
```

## EAS iOS

```bash
npm run build:ios:preview
```

Para TestFlight, troque profile iOS de simulador para dispositivo e configure Apple Developer.

## Escalabilidade Supabase por fase de crescimento

O projeto preve tres fases de crescimento de acessos simultaneos. Cada fase exige ajustes no plano e na configuracao do Supabase.

### Fase 1: ate 400 acessos simultaneos (lancamento)

- Plano Pro ($25/mes) e suficiente.
- Compute Small ou Medium.
- Supavisor em modo `transaction` desde o inicio.

### Fase 2: ate 1.000 acessos simultaneos (~3 meses)

- Manter Plano Pro, subir compute para Medium ou Large ($50-100/mes adicional).
- Monitorar uso de conexoes no dashboard Supabase.
- Avaliar read replicas se consultas de extrato ou dashboard admin ficarem lentas.

### Fase 3: ate 10.000 acessos simultaneos (~6 meses)

- Compute Large, XL ou 2XL ($200-800/mes).
- Read replicas obrigatorias para consultas pesadas (extrato, auditoria, dashboard admin).
- Avaliar migracao para Plano Team ($599/mes) se precisar de suporte prioritario ou SLA.
- Connection pooling (Supavisor modo `transaction`) e critico; sem ele o PostgreSQL nao suporta 10k conexoes diretas.
- Edge Functions escalam automaticamente por serem serverless, mas monitorar latencia de cold start em operacoes financeiras (transferencia, estorno). Considerar estrategia de keep-alive se cold start ultrapassar 500ms.
- Custo total estimado nesta fase: $300-1.000/mes dependendo de storage, bandwidth e compute.

### Acoes preventivas independentes de fase

- Nunca usar conexao direta do cliente ao PostgreSQL; sempre passar por Supavisor em modo `transaction`.
- Monitorar metricas de conexao, latencia de Edge Functions e tamanho do banco mensalmente.
- Manter `wallets.balance` como cache e o ledger como fonte da verdade; isso permite escalar leituras de saldo sem recalcular o ledger a cada consulta.
- Supabase e open-source e o PostgreSQL e portavel. Se o custo ficar inviavel, a migracao para infraestrutura propria e possivel sem reescrever o schema, as migrations ou as RLS policies.

## Checklist final

OAuth, RLS, migrations, Edge Functions, admins, limites, audit logs, APK Android, build iOS e docs.

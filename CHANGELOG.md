# Changelog

## 0.1.0 - 2026-06-16

- Criado monorepo YoungCoin em `ycbank`.
- Criado app mobile Expo com login Google, home, transferencia, receber QR, pagar QR, extrato e perfil.
- Criado painel web admin Next.js com dashboard, contas, wallets, transacoes, detalhe, organizacoes, auditoria, eventos de seguranca, limites e ajustes.
- Criado schema Supabase PostgreSQL com profiles, organizations, organization_members, wallets, transactions, audit_logs, transfer_limits e security_events.
- Criadas RLS policies, RPCs transacionais, limites, idempotencia e audit logs.
- Criadas Edge Functions obrigatorias.
- Criada documentacao de produto, arquitetura, banco, seguranca, mobile, web admin, backend, auditoria, deploy e roadmap.
- Criado script local de validacao de ledger.
- Ajustado app mobile web para modo demo sem Supabase configurado.
- Criados `apps/mobile/metro.config.js` e `apps/mobile/src/services/supabase.web.ts` para resolver execucao web no monorepo.
- Documentado workaround local do Android Emulator com GLIBC compat e estado de retomada.

# Roadmap

## Status Atual (2026-06-19)

**Progresso: 60/108 itens (56%)**

| Fase | Status | Itens | Concluidos |
|---|---|---|---|
| 0 - Estrutura e Identidade | Concluida | 11 | 11 |
| 1 - Backend Supabase | Em andamento | 22 | 20 |
| 2 - App Mobile Funcional | Em andamento | 33 | 29 |
| 3 - Painel Web Admin | Pendente | 20 | 0 |
| 4 - Preparacao 400 Alunos | Pendente | 14 | 0 |
| 5 - Lancamento | Pendente | 8 | 0 |

## Fase 1 MVP (40 dias estimados)

Carteira, ledger, OAuth, 4 tipos de usuario, chaves diferenciadas, painel admin, bloqueio, estorno, auditoria e builds de teste.

### Concluido ate agora
- Monorepo, identidade visual, schema, 12 docs
- Backend Supabase completo (7 Edge Functions, 3 migrations, RLS)
- OAuth Google funcionando (mobile web)
- Transacoes reais entre usuarios
- Extrato e notificacoes com nomes e tipos de usuario
- Toast global para feedback visual
- Mensagens de erro traduzidas para portugues
- 4 tipos de conta: personal, business, sub_business, system
- Chaves com prefixo: @ALN-, @EMP-, @SUBEMP-, @ADM-

### Proximo
- Build Android (APK para dispositivo fisico)
- Painel web admin funcional
- Preparacao para 400 alunos

## Fase 2 piloto escolar

Onboarding assistido, relatorios de escola, suporte e melhoria de UX.

## Fase 3 multi-escolas

Hierarquia de organizacoes, permissoes refinadas, dashboards por escola e limites customizados. Relacionamentos entre tipos de usuario (ver docs/13-tipos-usuarios-relacionamentos.md).

## Fase 4 marketplace/recompensas

Loja de recompensas, parceiros, catalogo e regras pedagogicas.

## Fase 5 antifraude avancado

Analise comportamental, device intelligence, alertas em tempo real, conciliacao e revisao manual.

## Pos-MVP registrado

- Abertura de contas por indicacao (usuario recebe link de convite)
- Notificacoes push reais (Firebase/Expo Notifications)
- Compartilhamento de comprovante real
- iOS (Apple Developer $99/ano)
- 2FA e biometria

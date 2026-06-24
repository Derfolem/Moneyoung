# Web Admin — MoneYoung Admin

Data: 2026-06-16 (atualizado 2026-06-24)

## Estrutura

`apps/web-admin` usa Next.js 14 App Router, TypeScript, Supabase client, layout administrativo com sidebar dark navy + gold e tabelas reutilizaveis.

## Identidade Visual

Tema dark navy (#0A1628) + gold (#D4A843), consistente com o mobile. CSS custom properties em `globals.css` definem toda a paleta. Fontes: Josefin Sans 700 (marca) e Inter 400-900 (UI) via Google Fonts `@import`.

| Variavel CSS | Cor | Uso |
|---|---|---|
| `--navy-deep` | `#0A1628` | Fundo body |
| `--navy-card` | `#0F2035` | Cards, sidebar, tabelas |
| `--navy-light` | `#162D4A` | Inputs, headers de tabela |
| `--gold` | `#D4A843` | Botoes, marca, links ativos, acentos |
| `--text-primary` | `#FFFFFF` | Texto principal |
| `--text-secondary` | `#8B9DC3` | Texto secundario |
| `--border` | `#1E3A5F` | Bordas gerais |
| `--border-gold` | `rgba(212,168,67,0.3)` | Bordas douradas em cards |

A marca "MoneYoung" aparece no sidebar em Josefin Sans 700 com cor gold, separada por borda dourada. Links ativos no sidebar tem fundo gold translucido e borda esquerda gold. Avatar do usuario logado no rodape do sidebar.

## Componentes

| Componente | Arquivo | Descricao |
|---|---|---|
| AdminShell | `src/components/AdminShell.tsx` | Layout com sidebar, validacao de sessao admin, navegacao |
| DataTable | `src/components/DataTable.tsx` | Tabela generica com colunas, loading, erro, empty state |
| StatusPill | `src/components/DataTable.tsx` | Badge colorido por status (active, blocked, completed, etc.) |
| StateMessage | `src/components/DataTable.tsx` | Mensagem de estado (loading, erro, vazio) |

## Servicos

| Funcao | Fonte | Descricao |
|---|---|---|
| invokeFunction | `src/services/admin.ts` | Chama Edge Functions via fetch direto (extrai erros reais) |
| requireAdminSession | `src/services/admin.ts` | Valida sessao e role bank_admin/super_admin |
| getDashboardSummary | Edge Function | Metricas completas: valor corrente, contas ativas, transacoes dia/mes/ano, estornos, wallets, restritas, eventos criticos + ultimas transacoes |
| listAccounts | Supabase direto | Profiles com busca, filtro por role e status |
| listWallets | Supabase direto | Wallets com filtro por status |
| listTransactions | enriched_transactions view | Transacoes com nomes e tipos dos participantes |
| getTransaction | enriched_transactions view | Detalhe de transacao com nomes, chaves e tipos |
| reverseTransaction | Edge Function | Estorno via reverse_transaction |
| changeWalletStatus | Edge Function | Bloquear/desbloquear via block_wallet |
| createOrganization | Edge Function | Criar escola via create_organization_account (gera codigos convite) |
| linkOrganizationMember | Supabase direto | Vincular usuario a organizacao |
| approveRegistration | Edge Function | Aprovar/rejeitar cadastro via approve_registration |
| adminCreditWallet | Edge Function | Creditar YC na wallet de escola |
| listAuditLogs | Supabase direto | Logs de auditoria com filtros |
| listSecurityEvents | Supabase direto | Eventos de seguranca com filtro por severidade |
| listTransferLimits | Supabase direto | Limites por tipo de conta |
| updateTransferLimit | Supabase direto | Editar limites (RLS exige bank_admin) |
| exportCsv | Local | Gera CSV no browser e faz download |

## Paginas do Painel (Menu Lateral)

### Login (`/login`)
Tela de acesso ao painel. Oferece dois metodos de autenticacao:
- **Entrar com Google** — botao OAuth com icone Google. Apos autenticar, o sistema verifica se o usuario tem role `bank_admin` ou `super_admin`. Se nao tiver, o acesso e rejeitado.
- **Email e senha** — formulario tradicional como alternativa ao Google.

Apos login bem-sucedido, redireciona para o Dashboard.

### Dashboard (`/dashboard`)
Visao geral do banco em tempo real. Exibe metricas organizadas em 3 secoes:

- **Financeiro:** Valor Corrente (soma de todos os saldos de wallets ativas, destacado com borda dourada), Total de Wallets, Wallets Restritas (bloqueadas ou congeladas, em vermelho), Estornos realizados.
- **Contas Ativas:** quantidade de Alunos (personal + active) e Escolas (business + active).
- **Transacoes:** quantidade de transacoes Hoje, Este Mes e Este Ano, e Eventos Criticos (em vermelho).

Abaixo das metricas: grafico de transacoes por dia (ultimos 30 dias) e tabela das ultimas transacoes com nomes dos participantes.

### Contas (`/accounts`)
Lista todos os perfis (usuarios) cadastrados no sistema. Permite:
- **Buscar** por nome ou email.
- **Filtrar** por role (bank_admin, organization_admin, common_user) e por status (active, pending, blocked).
- Cada perfil exibe um **badge** colorido indicando o tipo de conta (Aluno, Empresa, Professor, Admin).

Use esta tela para verificar quem esta cadastrado, qual o status de cada usuario e qual tipo de conta ele possui.

### Wallets (`/wallets`)
Lista todas as carteiras digitais do sistema. Permite:
- **Filtrar** por status (active, blocked, frozen, pending).
- **Bloquear** uma wallet — impede que o usuario faca qualquer transferencia. O admin deve informar o motivo do bloqueio.
- **Desbloquear** — reativa a wallet para uso normal.

Use esta tela para intervir em casos de suspeita de fraude, uso indevido ou a pedido do colegio/responsavel.

### Transacoes (`/transactions`)
Lista todas as transacoes realizadas no sistema. Permite:
- **Filtrar** por status (completed, reversed, failed), tipo (transfer, reversal, admin_adjustment), valor e wallet.
- Exibe **nomes** dos participantes (quem enviou e quem recebeu) em vez de apenas IDs.
- **Exportar CSV** — gera um arquivo para download com todas as transacoes filtradas.

### Detalhe da Transacao (`/transactions/[id]`)
Ao clicar em uma transacao, exibe todos os detalhes:
- Nomes, chaves Moneyoung e badges de tipo de ambos os participantes.
- Valor, descricao, status e data.
- Botao **Estornar** — reverte a transacao: devolve o valor ao remetente e debita do destinatario. Exige motivo. So funciona em transacoes com status `completed`.
- **Audit logs** relacionados a essa transacao.

### Organizacoes (`/organizations`)
Gerenciamento de escolas (colegios). Permite:
- **Criar escola** — formulario com nome e email do colegio. Ao criar, o sistema gera automaticamente dois codigos de convite (um para alunos, outro para colaboradores).
- **Excluir escola** — remove a organizacao do sistema.
- **Codigos de convite** — visiveis na tabela para cada escola. Formato AAA0000 (3 letras + 4 numeros). O codigo de alunos e o de colaboradores sao diferentes.
- **Vincular/desvincular membros** — adicionar ou remover usuarios de uma escola pela chave Moneyoung.
- **Alterar role** de um membro (aluno, professor, funcionario, diretor).
- **Definir PIN** — senha numerica de acesso a aba "Alunos" no app do colaborador.
- **Creditar YC** — transferir Youngcoins para a wallet da escola (modal com valor e descricao).

### Aprovacoes (`/approvals`)
Lista cadastros pendentes de aprovacao. Quando um novo usuario se cadastra via codigo de convite no app mobile, ele fica com status `pending` ate que o admin aprove.
- **Aprovar** — ativa o perfil e a wallet do usuario, permitindo que ele use o sistema.
- **Recusar** — bloqueia o perfil. O admin pode informar o motivo da recusa.

Cada registro mostra: nome, email, escola vinculada, tipo (aluno ou colaborador) e data do cadastro.

### Auditoria (`/audit`)
Registro completo de todas as acoes administrativas realizadas no sistema. Cada entrada mostra:
- **Acao** — o que foi feito (ex: organization.created, wallet.status_changed, transaction.reversed, registration.approved).
- **Entidade** — tipo do objeto afetado (profile, wallet, transaction, organization).
- **Ator** — quem realizou a acao (profile_id do admin).
- **Data** — quando aconteceu.
- **Filtros** — por acao e por entidade.
- **Exportar CSV** — gera arquivo para download.

Use esta tela para rastrear quem fez o que e quando. Essencial para auditoria financeira e resolucao de disputas.

### Seguranca (`/security-events`)
Registro de eventos suspeitos ou criticos detectados automaticamente pelo sistema. Exemplos de eventos:
- **Transferencia com wallet bloqueada** — alguem tentou transferir de uma wallet que esta bloqueada.
- **Rate limiting atingido** — muitas transferencias em sequencia rapida (possivel ataque ou automacao).
- **Acesso nao autorizado** — tentativa de chamar funcao admin por usuario comum.
- **Falhas de autenticacao repetidas.**

Cada evento tem:
- **Severidade** — `low` (informativo), `medium` (atencao), `high` (investigar), `critical` (acao imediata). Filtro disponivel.
- **Tipo do evento** — classificacao do que aconteceu.
- **Profile** — usuario envolvido.
- **Metadata** — detalhes adicionais (IP, user agent, descricao).

Use esta tela para monitorar atividades suspeitas, especialmente apos o lancamento com 400 alunos.

### Limites (`/limits`)
Configuracao dos limites de transferencia por tipo de conta. Exibe uma tabela com:
- **Tipo de conta** — Aluno, Empresa, Professor, Admin.
- **Limite por transacao** — valor maximo permitido em uma unica transferencia.
- **Limite diario** — valor maximo acumulado em um dia.
- **Por minuto** — numero maximo de transferencias por minuto (rate limiting).
- **Botao Editar** — abre formulario para alterar os valores.

Valores atuais:

| Tipo | Por transacao | Diario | Por minuto |
|---|---|---|---|
| Aluno | 250 YC | 1.000 YC | 10 |
| Empresa | 2.500 YC | 10.000 YC | 60 |
| Professor | 1.000 YC | 5.000 YC | 30 |
| Admin | Ilimitado | Ilimitado | Ilimitado |

Use esta tela para ajustar limites conforme o uso real. Se os alunos precisarem transferir mais, aumente aqui.

### Ajustes (`/settings`)
Tela de configuracoes do painel. Mostra:
- **Status do Supabase** — indica se a conexao com o banco de dados esta configurada corretamente.
- **Botao Sair** — encerra a sessao do admin e redireciona para o login.

As configuracoes de provedores (OAuth Google, chaves Supabase, deploy Vercel) sao feitas diretamente nos consoles dos respectivos servicos, nao nesta tela.

## Badges de tipo de conta

Mesmos badges do mobile, agora no admin:

| Tipo | Cor | Label |
|---|---|---|
| personal | Azul | Aluno |
| business | Laranja | Empresa |
| sub_business | Roxo | Professor |
| system | Vermelho | Admin |

## Permissoes

O AdminShell valida sessao e role `bank_admin` ou `super_admin` via `requireAdminSession()`. Acoes sensiveis (estorno, bloqueio, criar organizacao) passam por Edge Functions que verificam role novamente no backend.

RLS policies permitem que bank_admin leia todas as tabelas (profiles, wallets, transactions, audit_logs, security_events, transfer_limits, organizations).

## Rodar local

```bash
cd MYGbank
npm run dev:web
```

Abrir http://localhost:3000. Requer `.env` na raiz com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Deploy (Vercel)

Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas variaveis de ambiente do Vercel. Nao configure service_role_key no frontend.

Plano Free do Vercel fornece subdominio gratuito `seuapp.vercel.app`. Dominio proprio aguarda autorizacao de Fagner.

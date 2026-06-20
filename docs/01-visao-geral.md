# Visao geral

Moneyoung e uma carteira digital educacional com moeda Youngcoin (YC). O MVP funciona como um banco digital simples com 4 tipos de conta diferenciados por prefixo na chave Moneyoung.

## Controle De Escopo

- O MVP vive em `~/APPs/Fagner/ycbank`.
- O Git funcional do projeto e `~/APPs/Fagner/ycbank/.git`.
- `~/APPs/Fagner/.git` nao deve ser usado como base do MVP.
- Mudancas de codigo devem ficar dentro de `ycbank/`.
- Conteudo em `Fagner_documents/` e separado e nao deve ser tratado como codigo do app.

## Objetivo do MVP

Entregar app mobile, painel administrativo, backend Supabase, ledger auditavel, OAuth Google, estorno, bloqueio de wallet e documentacao.

## Incluido

- Login Google OAuth.
- Profile, young_key e wallet automaticos.
- Saldo, transferencia, recebimento por QR, pagamento por QR e extrato.
- Painel admin com contas, wallets, transacoes, auditoria, seguranca, organizacoes, limites e CSV.
- Ledger com transacoes imutaveis e estorno.
- Toast global para feedback visual (web e nativo).
- Nomes e tipos de usuario visiveis em transacoes, extrato e notificacoes.

## Nao incluido

CPF, RG, endereco, telefone obrigatorio, KYC, biometria, reconhecimento facial, bonus pedagogico, marketplace e loja de recompensas.

## Tipos de Conta (account_type)

| Tipo | Prefixo Chave | Descricao | Exemplos |
|---|---|---|---|
| `personal` | `@ALN-` | Aluno | Estudantes dos colegios |
| `business` | `@EMP-` | Empresa | Colegios, projetos, instituicoes, escolas |
| `sub_business` | `@SUBEMP-` | Sub-empresa | Professores, tutores, designados |
| `system` | `@ADM-` | Administrador | Operadores do Moneyoung |

## Perfis (roles)

- `common_user`: envia, recebe, paga e consulta.
- `organization_admin`: administra vinculos de organizacao.
- `bank_admin`: administra Moneyoungbank pelo painel.
- `super_admin`: acesso tecnico global.

## Chaves Moneyoung (young_key)

Cada usuario recebe uma chave publica unica no formato `@PREFIXO-nomeNNNN`. O prefixo identifica o tipo de conta para auditoria e transparencia. Exemplos:
- `@ALN-joao4521` (aluno)
- `@EMP-vemcer7834` (colegio)
- `@SUBEMP-profsil2341` (professor)
- `@ADM-admin8901` (administrador)

## Politica de Custos

Todos os custos do projeto devem ser autorizados pelo dono do projeto (**FAGNER**). O desenvolvimento deve sempre priorizar alternativas sem custo:
- Supabase Free (suficiente para MVP com 400 alunos)
- Vercel Free (subdominio gratuito `seuapp.vercel.app`)
- Sem dominio proprio ate autorizacao
- Sem contas pagas (Google Play $25, Apple Developer $99, Supabase Pro $25/mes) ate autorizacao

Quando um custo for inevitavel para avancar, documentar e aguardar aprovacao de Fagner.

## Fluxo geral

Usuario entra com Google, a Edge Function cria profile e wallet, o app consulta resumo, e qualquer movimento financeiro passa por funcao segura que valida autenticacao, status, saldo, limites e idempotencia. Transacoes retornam nomes e tipos dos participantes para auditoria.

## Relacionamentos futuros (pos-MVP)

Detalhados em `docs/13-tipos-usuarios-relacionamentos.md`:
- Empresa ↔ Aluno (vinculo por organizacao)
- Empresa ↔ Sub-empresa/Professor
- Hierarquia de distribuicao de YC: Admin → Empresa → Professor → Aluno

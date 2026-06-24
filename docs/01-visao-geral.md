# Visao geral

Moneyoung e uma carteira digital educacional com moeda Youngcoin (YC). O MVP funciona como um banco digital simples com 4 tipos de conta diferenciados por prefixo na chave Moneyoung.

## Identidade Visual

A marca e exibida como **MoneYoung** (wordmark em Josefin Sans 700 Bold). A paleta segue tema fintech dark navy + gold com efeitos premium:

| Token | Cor | Uso |
|---|---|---|
| `navyDeep` | `#0A1628` | Fundo principal |
| `glass` | `rgba(15,32,53,0.45)` | Cards e superficies (glassmorphism) |
| `gold` | `#D4A843` | Acentos, botoes primarios, marca |
| `textPrimary` | `#FFFFFF` | Texto principal |
| `textSecondary` | `#8B9DC3` | Texto secundario |

O mobile usa efeitos visuais premium: glassmorphism (cards semi-transparentes com blur), energia (glow pulsante dourado em botoes e saldos), poeira de ouro (particulas animadas flutuantes) e orbs ambientais (circulos de luz suave no fundo).

Navegacao mobile: BottomNav com 5 abas (Inicio, Transferir, Pagar, Extrato, Perfil) — variante staff para colaboradores (Inicio, Transferir, Receber, Alunos, Perfil).
Navegacao web admin: sidebar lateral com links e marca MoneYoung.

## Controle De Escopo

- O MVP vive em `~/APPs/Fagner/MYGbank`.
- O Git funcional do projeto e `~/APPs/Fagner/MYGbank/.git`.
- `~/APPs/Fagner/.git` nao deve ser usado como base do MVP.
- Mudancas de codigo devem ficar dentro de `MYGbank/`.
- Conteudo em `Fagner_documents/` e separado e nao deve ser tratado como codigo do app.

## Objetivo do MVP

Entregar app mobile, painel administrativo, backend Supabase, ledger auditavel, OAuth Google, estorno, bloqueio de wallet e documentacao.

## Incluido

- Login Google OAuth com fluxo de cadastro via codigo convite.
- Profile, young_key e wallet automaticos.
- Saldo, transferencia, recebimento por QR, pagamento por QR e extrato.
- Experiencia colaborador: conta compartilhada da escola, aba alunos com PIN.
- Painel admin com contas, wallets, transacoes, auditoria, seguranca, organizacoes, limites, aprovacoes e CSV.
- Ledger com transacoes imutaveis e estorno.
- Toast global para feedback visual (web e nativo).
- Nomes e tipos de usuario visiveis em transacoes, extrato e notificacoes.
- UI premium: glassmorphism, energia (glow pulsante), poeira de ouro (particulas animadas).

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

### Cadastro via codigo convite
1. Escola e criada pelo banco no web admin (gera codigos convite automaticos: AAA0000)
2. Usuario abre o app mobile e digita o codigo convite na tela `/invite`
3. Codigo validado → usuario faz login com Google OAuth
4. Preenche formulario de cadastro (nome, nascimento, localizacao, esporte, hobby)
5. Cadastro fica como `status = 'pending'` aguardando aprovacao do banco
6. Banco aprova/rejeita pelo painel admin
7. Apos aprovacao: alunos vao para `/home`, colaboradores vao para `/org-home`

### Operacao diaria
Usuario entra com Google, a Edge Function cria profile e wallet, o app consulta resumo, e qualquer movimento financeiro passa por funcao segura que valida autenticacao, status, saldo, limites e idempotencia. Transacoes retornam nomes e tipos dos participantes para auditoria.

### Colaboradores (sub_business)
Professores/funcionarios/diretores compartilham a wallet da escola (sem wallet pessoal). Transferencias sao identificadas por quem realizou. BottomNav diferenciado com aba Alunos (protegida por PIN).

## Relacionamentos

Detalhados em `docs/13-tipos-usuarios-relacionamentos.md`:
- Empresa ↔ Aluno (vinculo por organizacao via codigo convite)
- Empresa ↔ Sub-empresa/Professor (vinculo automatico via codigo convite staff)
- Hierarquia de distribuicao de YC: Admin → Empresa → Professor → Aluno

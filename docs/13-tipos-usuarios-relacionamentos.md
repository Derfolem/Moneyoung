# Tipos de Usuarios e Relacionamentos — Moneyoung

## Tipos de Conta (account_type)

| Tipo | Codigo | Prefixo Chave | Descricao | Exemplos |
|---|---|---|---|---|
| `personal` | ALN | `@ALN-nome1234` | Usuario comum / Aluno | Estudantes dos colegios |
| `business` | EMP | `@EMP-nome1234` | Usuario empresa | Colegios, projetos, instituicoes, escolas |
| `sub_business` | SUBEMP | `@SUBEMP-nome1234` | Usuario sub-empresa | Professores, tutores, designados |
| `system` | ADM | `@ADM-nome1234` | Administrador do banco | Operadores do Moneyoung |

## Roles (Papeis)

| Role | Permissoes |
|---|---|
| `common_user` | Transferir, pagar, receber, ver extrato |
| `organization_admin` | Gerenciar membros da organizacao, distribuir YC |
| `bank_admin` | Painel admin, estornos, bloqueios, criar organizacoes |
| `super_admin` | Tudo + configuracoes de sistema |

## Limites por Tipo de Conta

| Tipo | Limite/Transacao | Limite Diario | Transacoes/Minuto |
|---|---|---|---|
| personal (Aluno) | 250 YC | 1.000 YC | 10 |
| business (Empresa) | 2.500 YC | 10.000 YC | 60 |
| sub_business (Professor) | 1.000 YC | 5.000 YC | 30 |
| system (Admin) | Ilimitado | Ilimitado | Ilimitado |

## Formato das Chaves Moneyoung

A chave Moneyoung (young_key) identifica cada usuario de forma unica e publica.
O prefixo indica o tipo de conta para auditoria e transparencia:

- `@ALN-` → Aluno (personal)
- `@EMP-` → Empresa (business)
- `@SUBEMP-` → Sub-empresa / Professor (sub_business)
- `@ADM-` → Administrador (system)

Formato completo: `@PREFIXO-nome_base_NNNN` (4 digitos aleatorios)

## Relacionamentos Futuros (Pos-MVP)

> **IMPORTANTE:** Estes relacionamentos serao implementados apos o MVP.
> A estrutura de banco (tabelas organizations e organization_members) ja suporta a base.

### 1. Empresa ↔ Aluno
- Um colegio (business) tera N alunos (personal) vinculados
- O colegio distribui YC para seus alunos
- O colegio pode ver transacoes dos seus alunos (auditoria educacional)
- Tabela: `organization_members` com `member_role = 'student'`

### 2. Empresa ↔ Sub-Empresa (Professor)
- Um colegio (business) tera N professores/tutores (sub_business) vinculados
- Professores podem distribuir YC para alunos em nome do colegio
- Professores podem ter permissoes parciais de admin da organizacao
- Tabela: `organization_members` com `member_role = 'teacher'` ou `'staff'`

### 3. Admin Banco ↔ Empresa
- O admin do banco (system) cria e gerencia as empresas
- O admin credita o capital inicial na wallet da empresa
- O admin pode bloquear/desbloquear empresas
- Fluxo: Admin → credita YC → Empresa → distribui → Professores/Alunos

### 4. Hierarquia de Distribuicao de YC
```
Moneyoung (ADM) ──── credita capital ────→ Colegio (EMP)
                                              │
                                    ┌─────────┴─────────┐
                                    ▼                     ▼
                              Professor (PRF)        Aluno (ALN)
                                    │
                                    ▼
                              Aluno (ALN)
```

### 5. Auditoria por Tipo
- No extrato e nas notificacoes, o tipo do usuario (badge) aparece ao lado do nome
- Isso permite saber se quem transferiu foi Aluno, Professor, Empresa ou Admin
- Facilita auditoria educacional e rastreamento de fluxo de YC

### 6. Regras de Negocio Futuras
- [ ] Aluno so pode transferir para alunos do mesmo colegio (restricao opcional)
- [ ] Professor pode premiar alunos diretamente (com limite proprio)
- [ ] Empresa pode definir limites customizados para seus alunos
- [ ] Dashboard da empresa mostra ranking e metricas dos alunos
- [ ] Relatorio mensal automatico por organizacao
- [ ] Convites por link (abertura de conta por indicacao — ja registrado no checklist)

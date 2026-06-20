# Redesign Visual Mobile - Demo para Investidores

Data: 2026-06-17 (atualizado 2026-06-19)

## Objetivo

Redesign completo da interface mobile Moneyoung para apresentacao a investidores. Todas as telas seguem os mockups aprovados com identidade visual fintech dark navy blue.

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

## Componentes

| Componente | Descricao |
|---|---|
| Screen | Container com scroll, safe area e padding |
| Button | Botao com 3 tons: primary, secondary, ghost |
| PageHeader | Header com titulo e botao voltar |
| HexLogo | Logo hexagonal SVG |
| Drawer | Menu lateral (hamburger) |
| TransactionRow | Linha de transacao com nome do participante, badge de tipo e chave |
| StateView | Estado vazio, loading ou erro |
| Toast (ToastHost) | Notificacao visual global (sucesso/erro/info), substitui Alert.alert |

## Badges de tipo de usuario

O `TransactionRow` exibe um badge colorido ao lado do nome do participante:

| Tipo | Cor | Label |
|---|---|---|
| personal | Azul (primary) | Aluno |
| business | Laranja (#E65100) | Empresa |
| sub_business | Roxo (#6A1B9A) | Professor |
| system | Vermelho (danger) | Administrador |

## Telas

1. **Login** — fundo navy escuro completo, HexLogo, botao Google OAuth
2. **Home** — saudacao contextual, card de saldo, acoes rapidas, ultimas transacoes com nomes
3. **Transferir** — valor grande central, campos de destino e descricao
4. **Confirmar** — resumo da transferencia com botao confirmar
5. **Comprovante** — header navy, card com detalhes, botao compartilhar
6. **Pagar** — scanner QR Code com overlay, fallback para input manual
7. **Receber** — QR Code com logo overlay, botao copiar chave (toast de confirmacao)
8. **Extrato** — filtros (tudo/entradas/saidas), transacoes com nomes e badges de tipo
9. **Notificacoes** — entradas e saidas reais com nomes, valores e badges de tipo
10. **Perfil** — dados do usuario, botao sair

## Navegacao

```
login -> home
home -> transfer | pay | receive | statement | profile | notifications
transfer -> transfer-confirm
transfer-confirm -> receipt
receipt -> home
notifications -> home (back)
```

## Como testar

```bash
cd ~/APPs/Fagner/ycbank/apps/mobile
npm run web
```

Abrir http://localhost:8081. Com .env vazio, o app entra em modo demo. Com .env preenchido, conecta ao Supabase real.

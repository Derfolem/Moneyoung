-- Adicionar 'pending' como status valido para wallets
-- Necessario para o fluxo de cadastro via convite (wallet criada com status pending ate aprovacao)
ALTER TABLE public.wallets DROP CONSTRAINT wallets_status_check;
ALTER TABLE public.wallets ADD CONSTRAINT wallets_status_check CHECK (status = ANY (ARRAY['active', 'blocked', 'frozen', 'pending']));

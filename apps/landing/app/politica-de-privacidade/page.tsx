import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de Privacidade — MoneYoung"
};

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000000",
        color: "#E5E5E5",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "8vw 6vw",
        lineHeight: 1.6
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <a href="/" style={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem" }}>
          ← MoneYoung
        </a>

        <h1 style={{ color: "#FFFFFF", fontSize: "1.9rem", marginTop: "1.5rem" }}>
          Política de Privacidade
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "0.9rem" }}>Última atualização: 06 de julho de 2026</p>

        <p>
          O MoneYoung é uma plataforma bancária educacional que utiliza uma moeda virtual sem
          valor monetário real (Youngcoin) para ensinar educação financeira e empreendedorismo a
          alunos de instituições de ensino parceiras. O acesso ao aplicativo é restrito: o
          cadastro exige um código de convite fornecido pela escola e não é aberto ao público em
          geral.
        </p>

        <h2 style={{ color: "#FFFFFF", fontSize: "1.3rem", marginTop: "2rem" }}>
          Quais dados coletamos
        </h2>
        <ul>
          <li>Endereço de e-mail, vinculado à sua conta Google usada para login;</li>
          <li>Nome e identificador único de usuário (chave MoneYoung);</li>
          <li>Dados de uso da conta: saldo, histórico de transações e transferências realizadas dentro do app.</li>
        </ul>

        <h2 style={{ color: "#FFFFFF", fontSize: "1.3rem", marginTop: "2rem" }}>
          Para que usamos esses dados
        </h2>
        <ul>
          <li>Autenticar o acesso à sua conta;</li>
          <li>Viabilizar o funcionamento do app (saldo, transferências entre contas, extrato);</li>
          <li>Registrar auditoria de segurança e prevenir uso indevido da plataforma.</li>
        </ul>

        <h2 style={{ color: "#FFFFFF", fontSize: "1.3rem", marginTop: "2rem" }}>
          Compartilhamento de dados
        </h2>
        <p>
          Não vendemos nem compartilhamos seus dados pessoais com terceiros para fins de
          publicidade ou marketing. Os dados ficam armazenados em infraestrutura própria do
          projeto (Supabase), acessível apenas pela equipe responsável pela operação da
          plataforma e pela instituição de ensino à qual sua conta está vinculada.
        </p>

        <h2 style={{ color: "#FFFFFF", fontSize: "1.3rem", marginTop: "2rem" }}>
          Seus direitos
        </h2>
        <p>
          Você pode solicitar a qualquer momento a correção ou exclusão dos seus dados e da sua
          conta, entrando em contato pelo e-mail abaixo. Ao excluir a conta, os dados pessoais são
          removidos e o histórico de transações é desvinculado da sua identidade.
        </p>

        <h2 style={{ color: "#FFFFFF", fontSize: "1.3rem", marginTop: "2rem" }}>Contato</h2>
        <p>
          Dúvidas sobre esta política ou sobre seus dados podem ser enviadas para{" "}
          <a href="mailto:contato@moneyoung.com" style={{ color: "#FFFFFF" }}>
            contato@moneyoung.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}

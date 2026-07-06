import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Política de Privacidade — MoneYoung"
};

function H2({ children }: { children: ReactNode }) {
  return (
    <h2 style={{ color: "#FFFFFF", fontSize: "1.3rem", marginTop: "2.25rem" }}>{children}</h2>
  );
}

function H3({ children }: { children: ReactNode }) {
  return (
    <h3 style={{ color: "#FFFFFF", fontSize: "1.05rem", marginTop: "1.5rem" }}>{children}</h3>
  );
}

export default function PrivacyPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000000",
        color: "#D1D5DB",
        fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        padding: "8vw 6vw 6rem",
        lineHeight: 1.65
      }}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <a href="/" style={{ color: "#9CA3AF", textDecoration: "none", fontSize: "0.9rem" }}>
          ← MoneYoung
        </a>

        <h1 style={{ color: "#FFFFFF", fontSize: "1.9rem", marginTop: "1.5rem" }}>
          Política de Privacidade
        </h1>
        <p style={{ color: "#9CA3AF", fontSize: "0.9rem" }}>
          Documento disponibilizado em 06 de julho de 2026
        </p>

        <H2>O que faremos com suas informações?</H2>
        <p>
          Fizemos o máximo para explicar de forma clara e simples quais dados pessoais
          precisaremos de você e o que vamos fazer com cada um deles. Por isso, separamos abaixo
          os pontos mais importantes, que também podem ser lidos de forma completa e detalhada no
          nosso Aviso de Privacidade, logo a seguir.
        </p>
        <p>
          Estamos sempre disponíveis para tirar qualquer dúvida que você tenha, inclusive sobre
          seus dados pessoais, pelo e-mail{" "}
          <a href="mailto:contato@moneyoung.com" style={{ color: "#FFFFFF" }}>
            contato@moneyoung.com
          </a>
          .
        </p>

        <H3>Quem é o responsável pelo tratamento de dados?</H3>
        <p>
          O MoneYoung é o controlador dos dados inseridos na plataforma, tanto no aplicativo
          quanto no painel administrativo. Da mesma forma, a instituição de ensino responsável
          pelo acesso do usuário é controladora dos dados pessoais de terceiros que autorizar a
          incluir na plataforma, como dados de alunos e colaboradores, já que é a instituição
          quem decide quem recebe acesso e em quais condições.
        </p>
        <p>
          A instituição de ensino deve informar previamente aos titulares sobre o
          compartilhamento de dados com o MoneYoung e não deve autorizar o cadastro de crianças
          sem a ciência e autorização de um dos pais ou responsável legal, nos casos necessários.
          Da mesma forma, a instituição é responsável por solicitar a exclusão dos dados de
          usuários que a solicitarem diretamente, enquanto o vínculo com o MoneYoung estiver
          ativo.
        </p>
        <p>
          Alguns suboperadores são necessários para que o MoneYoung esteja disponível, como
          serviços de banco de dados, autenticação e hospedagem. Nossas contratações sempre
          prezam pelo tratamento seguro das informações.
        </p>

        <H3>Como fazemos a segurança de seus dados?</H3>
        <p>
          O MoneYoung se preocupa com a segurança dos seus dados pessoais e busca seguir as boas
          práticas recomendadas pela Autoridade Nacional de Proteção de Dados (ANPD) para agentes
          de tratamento de pequeno porte. Os dados são armazenados em ambiente com controle de
          acesso, criptografia em trânsito (HTTPS/TLS) e políticas de acesso restrito por perfil
          de usuário (RLS — Row Level Security), utilizando a infraestrutura em nuvem da Supabase
          para o banco de dados e autenticação, e da Vercel para a hospedagem do painel
          administrativo e deste site institucional.
        </p>

        <H3>Quais dados você precisa nos informar para utilizar a plataforma?</H3>
        <p>
          Para ter acesso ao MoneYoung, o usuário precisa ter seu acesso liberado por uma
          instituição de ensino, por meio de um código de convite — não há cadastro aberto ao
          público. No cadastro, são solicitadas as seguintes informações: nome completo, data de
          nascimento e e-mail (vinculado à conta Google usada para login). A partir dessas
          informações, o sistema gera automaticamente um identificador único de usuário (chave
          MoneYoung).
        </p>

        <H3>Quais dados coletamos de forma indireta?</H3>
        <p>
          Utilizamos um sistema próprio de monitoramento de erros para identificar falhas
          técnicas durante o uso do aplicativo ou do painel administrativo (tela em que ocorreu,
          ação realizada, código e mensagem de erro, plataforma e versão do app). Isso permite que
          a equipe responsável identifique e corrija problemas com mais eficiência.
        </p>

        <H3>Para quais finalidades utilizamos os seus dados pessoais?</H3>
        <p>Podemos tratar suas informações para:</p>
        <ul>
          <li>Prestar o nosso serviço;</li>
          <li>Criar contas e identificar o usuário;</li>
          <li>Viabilizar transferências, saldo e extrato dentro da plataforma;</li>
          <li>Dar suporte e realizar atendimento ao usuário;</li>
          <li>Registrar auditoria de segurança e prevenir uso indevido da plataforma;</li>
          <li>Compartilhar informações sobre saldo e transações com a instituição de ensino e com usuários colaboradores autorizados (professores, funcionários), quando aplicável;</li>
          <li>Detectar e corrigir erros no aplicativo e no painel administrativo.</li>
        </ul>
        <p>
          Não utilizamos os dados pessoais dos usuários para fins de marketing ou publicidade de
          terceiros.
        </p>

        <H3>Com quem compartilhamos seus dados pessoais?</H3>
        <p>
          Compartilhamos dados com a instituição de ensino à qual sua conta está vinculada e com
          usuários colaboradores por ela autorizados (dentro dos limites de cada papel), além dos
          suboperadores de infraestrutura Supabase (banco de dados e autenticação) e Vercel
          (hospedagem), sempre em caso de necessidade para prestação do serviço, consentimento
          legal do titular e/ou por força de ordem judicial ou determinação legal.
        </p>

        <H3>Seus registros de acesso serão coletados?</H3>
        <p>
          Sim. Quando você acessa a plataforma, coletamos os registros de acesso (data, hora e
          endereço IP de uso). Essas informações são mantidas sob sigilo, em ambiente controlado e
          seguro, pelo prazo mínimo de 6 (seis) meses, nos termos da Lei nº 12.965/2014 (Marco
          Civil da Internet) e do art. 7º, II, da Lei nº 13.709/2018 (LGPD).
        </p>

        <H3>Cancelamento de conta e exclusão de dados</H3>
        <p>
          Você pode solicitar o cancelamento da sua conta e a exclusão dos seus dados a qualquer
          momento pelo e-mail{" "}
          <a href="mailto:contato@moneyoung.com" style={{ color: "#FFFFFF" }}>
            contato@moneyoung.com
          </a>
          . Após a solicitação, seus dados pessoais são removidos permanentemente, exceto aqueles
          cuja manutenção seja obrigatória por lei (como os registros de acesso mencionados
          acima). A instituição de ensino também pode determinar a exclusão dos dados de contas
          vinculadas a ela, enquanto seu vínculo com o MoneYoung estiver ativo.
        </p>

        <H3>Quais são seus direitos?</H3>
        <p>
          A qualquer momento, você pode solicitar: confirmação da existência de tratamento dos
          seus dados; acesso aos seus dados; correção de dados incompletos ou desatualizados;
          anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em
          desconformidade com a lei; portabilidade dos dados a outro fornecedor; eliminação dos
          dados, exceto aqueles exigidos por lei; informação sobre com quem compartilhamos seus
          dados; e a revogação do seu consentimento.
        </p>

        <hr style={{ border: "none", borderTop: "1px solid #27272A", margin: "3rem 0" }} />

        <h2 style={{ color: "#FFFFFF", fontSize: "1.6rem" }}>Aviso de Privacidade</h2>
        <p>
          Antes de acessar o aplicativo MoneYoung ou seu painel administrativo, é importante que
          você leia, entenda e aceite de forma livre, inequívoca e informada este Aviso de
          Privacidade.
        </p>
        <p>
          Este documento visa prestar informações sobre o tratamento dos dados fornecidos pelos
          usuários e está em conformidade com a Lei nº 12.965/2014 (Marco Civil da Internet) e com
          a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).
        </p>

        <H2>1. Explicação dos termos técnicos</H2>
        <ul>
          <li><strong>App:</strong> aplicativo MoneYoung, disponível para dispositivos móveis.</li>
          <li><strong>Controlador:</strong> pessoa natural ou jurídica a quem competem as decisões referentes ao tratamento de dados pessoais.</li>
          <li><strong>Cookies:</strong> pequenos arquivos usados pelo painel administrativo (versão web) para manter sua sessão autenticada.</li>
          <li><strong>Criptografia:</strong> conjunto de técnicas para tornar a informação ilegível a quem não tenha acesso autorizado.</li>
          <li><strong>Dado pessoal:</strong> informação relacionada a pessoa natural identificada ou identificável.</li>
          <li><strong>Instituição:</strong> instituição de ensino que contrata o acesso ao MoneYoung para que seus alunos e colaboradores possam utilizar a plataforma.</li>
          <li><strong>IP (Internet Protocol):</strong> identificação única de um dispositivo conectado a uma rede.</li>
          <li><strong>Operador:</strong> pessoa que realiza o tratamento de dados pessoais em nome do controlador.</li>
          <li><strong>Tratamento de dados:</strong> qualquer operação realizada com dados pessoais, como coleta, uso, acesso, armazenamento, eliminação ou compartilhamento.</li>
        </ul>

        <H3>Usuários da plataforma</H3>
        <ul>
          <li><strong>Usuários:</strong> alunos com acesso liberado por uma instituição de ensino para utilizar o aplicativo.</li>
          <li><strong>Usuários Colaboradores:</strong> professores, funcionários ou diretores com acesso liberado pela instituição, podendo ter permissões diferentes das dos alunos.</li>
          <li><strong>Instituição/Escola:</strong> conta responsável pela organização, que autoriza e gerencia os acessos de alunos e colaboradores.</li>
        </ul>

        <H2>2. Agentes de tratamento</H2>
        <p>
          O MoneYoung é controlador dos dados inseridos na plataforma. A instituição de ensino
          responsável pelo acesso do usuário é controladora dos dados pessoais de terceiros que
          coletar e incluir na plataforma, como dados de alunos e colaboradores, já que é a
          instituição quem determina os elementos essenciais do tratamento e as finalidades
          específicas de cada acesso concedido.
        </p>
        <p>
          É responsabilidade da instituição garantir que a coleta, inclusão, uso e período de
          retenção dos dados das pessoas a quem concedeu acesso sejam feitos em conformidade com a
          LGPD, respeitando os princípios da segurança, informação, transparência, necessidade,
          adequação, qualidade e finalidade.
        </p>
        <p>
          Caso o usuário seja uma criança com até 12 (doze) anos incompletos, é necessário que um
          dos pais ou responsável legal autorize o cadastro na plataforma, mediante consentimento
          fornecido à instituição de ensino responsável. O MoneYoung não se responsabiliza por
          acessos concedidos pela instituição sem a devida autorização, sendo de responsabilidade
          exclusiva da instituição coletar e confirmar essa autorização antes de solicitar a
          criação do acesso.
        </p>
        <p>
          Alguns suboperadores são necessários para que a plataforma esteja disponível:
        </p>
        <ul>
          <li><strong>Supabase:</strong> banco de dados, autenticação e funções de backend do MoneYoung.</li>
          <li><strong>Vercel:</strong> hospedagem do painel administrativo e deste site institucional.</li>
        </ul>
        <p>
          Nossas contratações sempre prezam pelo tratamento seguro das informações. A partir do
          momento em que essas empresas têm acesso aos dados, tornam-se responsáveis pela
          segurança e pelo tratamento adequado dessas informações, não podendo utilizá-las para
          outras finalidades.
        </p>
        <p>
          <strong>Transferência internacional:</strong> os suboperadores utilizados pelo MoneYoung
          operam infraestrutura em nuvem que pode envolver servidores localizados fora do Brasil.
          Nesses casos, são adotadas as garantias de segurança exigidas pelo art. 33 da Lei nº
          13.709/2018.
        </p>

        <H2>3. Segurança da informação</H2>
        <p>
          Os registros de acesso (data, hora e endereço IP de uso da aplicação) são mantidos pelo
          MoneYoung, sob sigilo, em ambiente controlado e seguro, pelo prazo mínimo de 6 (seis)
          meses, nos termos da Lei nº 12.965/2014 e do art. 7º, II, da Lei nº 13.709/2018.
        </p>
        <p>
          O MoneYoung se compromete a preservar a estabilidade, segurança e funcionalidade da
          plataforma por meio de medidas técnicas compatíveis com boas práticas de mercado.
          Nenhum serviço disponível na internet possui garantia absoluta contra invasões ilegais;
          em caso de incidente de segurança, o MoneYoung diligenciará para identificar a causa e
          mitigar os danos.
        </p>

        <H2>4. Coleta de dados</H2>
        <p>
          <strong>Dados coletados diretamente:</strong> para ter acesso aos serviços, o usuário
          precisa ter seu acesso liberado por uma instituição de ensino e criar uma conta,
          fornecendo nome completo, data de nascimento e e-mail (vinculado ao login via Google). A
          partir disso, o sistema gera automaticamente um identificador único (chave MoneYoung).
        </p>
        <p>
          <strong>Dados coletados indiretamente:</strong> por meio de um sistema próprio de
          monitoramento, coletamos informações técnicas sobre erros e exceções ocorridas durante o
          uso do aplicativo ou do painel administrativo, permitindo identificar e corrigir
          problemas com mais eficiência.
        </p>

        <H2>5. Tratamento de dados pessoais</H2>
        <p>Ao utilizar o MoneYoung, o usuário compreende que o tratamento dos dados abaixo é necessário para o funcionamento da plataforma:</p>

        <H3>Nome completo</H3>
        <p><strong>Base legal:</strong> execução de contrato ou procedimentos preliminares a pedido do titular dos dados (art. 7º, V, Lei nº 13.709/2018).</p>
        <p><strong>Finalidade:</strong> identificação e verificação do usuário.</p>

        <H3>E-mail</H3>
        <p><strong>Base legal:</strong> execução de contrato a pedido do titular (art. 7º, V, Lei nº 13.709/2018).</p>
        <p><strong>Finalidade:</strong> criação da conta e autenticação; comunicação direta com o usuário, incluindo notificações de atualizações de serviço, alterações neste Aviso de Privacidade ou redefinição de acesso.</p>

        <H3>Data de nascimento</H3>
        <p><strong>Base legal:</strong> execução de contrato a pedido do titular (art. 7º, V, Lei nº 13.709/2018).</p>
        <p><strong>Finalidade:</strong> verificação de idade para fins de proteção de crianças e adolescentes, conforme responsabilidade da instituição de ensino.</p>

        <H3>Chave MoneYoung, tipo de conta, saldo e histórico de transações</H3>
        <p><strong>Base legal:</strong> execução de contrato a pedido do titular (art. 7º, V, Lei nº 13.709/2018).</p>
        <p><strong>Finalidade:</strong> identificar o usuário na plataforma e viabilizar transferências, saldo e extrato. A instituição de ensino e os usuários colaboradores por ela autorizados podem visualizar esses dados dentro dos limites do seu papel.</p>

        <H3>IP, data e hora de acesso</H3>
        <p><strong>Base legal:</strong> cumprimento de obrigação legal pelo controlador (art. 7º, II, Lei nº 13.709/2018).</p>
        <p><strong>Finalidade:</strong> obediência ao art. 15 da Lei nº 12.965/2014, que impõe o dever de manter os registros de acesso sob sigilo, em ambiente controlado e seguro, pelo prazo de 6 (seis) meses.</p>

        <H2>6. Cancelamento da plataforma, de contas de acesso e exclusão de dados</H2>
        <p>
          <strong>6.1. Cancelamento pelo MoneYoung:</strong> o MoneYoung poderá, a seu critério,
          bloquear, restringir ou impedir o acesso de qualquer usuário à plataforma sempre que for
          detectada conduta inadequada, diante de solicitação da instituição de ensino ou do
          encerramento do vínculo com a instituição.
        </p>
        <p>
          <strong>6.2. Cancelamento pelo usuário:</strong> o usuário pode cancelar sua conta pelo
          e-mail{" "}
          <a href="mailto:contato@moneyoung.com" style={{ color: "#FFFFFF" }}>
            contato@moneyoung.com
          </a>
          . O MoneYoung reportará o cancelamento para a instituição de ensino à qual o usuário
          está vinculado.
        </p>
        <p>
          <strong>6.3. Exclusão dos dados:</strong> quando finda a finalidade do tratamento ou
          diante de solicitação pelo e-mail acima, o usuário terá seus dados pessoais eliminados
          permanentemente, exceto aqueles cuja manutenção seja obrigatória por lei ou necessária
          para o exercício regular de direitos em processo judicial ou administrativo, como os
          registros de acesso mencionados na seção 3.
        </p>

        <H2>7. Direitos do titular dos dados pessoais</H2>
        <p>O titular de dados pessoais tem direito a obter do controlador, a qualquer momento e mediante requisição:</p>
        <ul>
          <li>Confirmação da existência de tratamento de dados;</li>
          <li>Acesso aos dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade com a lei;</li>
          <li>Portabilidade dos dados a outro fornecedor, observados os segredos comercial e industrial;</li>
          <li>Eliminação dos dados tratados com consentimento do titular, exceto nas hipóteses legais;</li>
          <li>Informação sobre com quem o controlador compartilhou os dados;</li>
          <li>Informação sobre a possibilidade de não fornecer consentimento e suas consequências;</li>
          <li>Revogação do consentimento.</li>
        </ul>

        <H2>8. Mudanças no Aviso de Privacidade</H2>
        <p>
          O MoneYoung poderá adicionar e/ou modificar qualquer cláusula deste Aviso de
          Privacidade. A versão atualizada valerá para o uso da plataforma a partir de sua
          publicação. A continuidade de acesso ou uso da plataforma após a divulgação confirma a
          vigência do novo Aviso de Privacidade. Caso a mudança exija consentimento, será
          apresentada a opção de aceitar ou recusar o novo texto de forma livre e informada.
        </p>

        <H2>9. Canal de comunicação sobre privacidade</H2>
        <p>
          Por não possuir, no momento, um encarregado de dados formalmente designado,
          disponibilizamos o e-mail{" "}
          <a href="mailto:contato@moneyoung.com" style={{ color: "#FFFFFF" }}>
            contato@moneyoung.com
          </a>{" "}
          como canal direto para tratar de qualquer assunto envolvendo dados pessoais ou dúvidas
          gerais sobre a plataforma.
        </p>
      </div>
    </main>
  );
}

import Image from "next/image";
import logo from "../public/moneyoung-logo.png";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#000000",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "5vw"
      }}
    >
      <Image
        src={logo}
        alt="MoneYoung"
        priority
        style={{ width: "100%", height: "auto", maxWidth: "640px" }}
      />
    </main>
  );
}

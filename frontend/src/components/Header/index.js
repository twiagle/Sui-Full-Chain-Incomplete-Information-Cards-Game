import "./index.css"
import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";

function Header() {
    return (
        <div className="wallet">
            <ConnectButton />
        </div>
    );
}
export default Header
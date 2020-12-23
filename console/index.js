import repl from "repl";
import _ from "lodash";
import MirrorProtocolDeployer from "../deployment/mirror-protocol-deployer";

const context = {
    deploy: () => MirrorProtocolDeployer.call()
};

console.log(`🪞  Mirror Protocol Deployer

To deploy, run the following command:

await deploy()
`);

let replServer = repl.start({
    prompt: "api >",
});

_.assign(replServer.context, context);

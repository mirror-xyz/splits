import MirrorProtocolDeployer from "../deployment/mirror-protocol-deployer";

MirrorProtocolDeployer.call()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });

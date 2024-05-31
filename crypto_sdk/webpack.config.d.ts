import NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
export let entry: string;
export let devtool: string;
export namespace output {
    let path: string;
    let filename: string;
}
export namespace devServer {
    let _static: string;
    export { _static as static };
}
export let plugins: NodePolyfillPlugin[];

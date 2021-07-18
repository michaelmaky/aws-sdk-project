const util = require('util');
import ProxyAgent from 'proxy-agent';
import { NodeHttpHandler } from '@aws-sdk/node-http-handler';
import {
  LambdaClient,
  LambdaClientConfig,
  ListFunctionsCommand,
  ListFunctionsCommandInput,
  ListFunctionsCommandOutput,
  UpdateFunctionConfigurationCommand,
  UpdateFunctionConfigurationCommandInput,
  UpdateFunctionConfigurationCommandOutput,
} from '@aws-sdk/client-lambda';

export const updateSubnet = async () => {
  try {
    const config: LambdaClientConfig = {};
    // base on proxy or local .aws credential
    if (process.env.PROXY_AGENT) {
      const proxyAgent = new ProxyAgent(process.env.PROXY_AGENT);
      const requestHandler = new NodeHttpHandler({
        httpAgent: proxyAgent,
        httpsAgent: proxyAgent,
      });
    } else {
      config.region = process.env.REGION || 'ap-southeast-1';
    }

    const client = new LambdaClient(config);

    const params: ListFunctionsCommandInput = {
      /** input parameters */
    };
    const cmdListFunctions = new ListFunctionsCommand(params);
    const outputListFunctions: ListFunctionsCommandOutput = await client.send(cmdListFunctions);

    console.log('outputListFunctions:', util.inspect(outputListFunctions, false, null, true));

    const funcationNames = outputListFunctions.Functions?.map((fn) => ({
      FunctionName: fn.FunctionName,
      VpcConfig: fn.VpcConfig,
    }));
    // console.log('funcationNames:', funcationNames);

    // const args = process.argv.slice(2);
    // console.log('args:', args);
    // update subnetIds to []

    let newSubnetIds: Array<string> = [];
    let newSecurityGroupIds: Array<string> = [];
    if (funcationNames) {
      newSecurityGroupIds = funcationNames[0].VpcConfig?.SecurityGroupIds || [];
      newSubnetIds = funcationNames[0].VpcConfig?.SubnetIds || [];
      // remove first element of SubnetIds
      newSubnetIds.shift();
    }
    const inputUpdateCmd: UpdateFunctionConfigurationCommandInput = {
      FunctionName: 'LambdaAPI',
      VpcConfig: {
        SubnetIds: newSubnetIds,
        SecurityGroupIds: newSecurityGroupIds,
      },
    };
    const cmdUpdateConfig = new UpdateFunctionConfigurationCommand(inputUpdateCmd);
    const output: UpdateFunctionConfigurationCommandOutput = await client.send(cmdUpdateConfig);

    if (output) {
      console.log('update lambda configuration successfully.');
    }
  } catch (e) {
    console.log(e);
  }
};

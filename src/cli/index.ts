import * as fs from 'fs';
import { program, Argument, Command } from 'commander';
import log from 'loglevel';

export { Argument } from 'commander';

export class Program {
  static parseAsync(args): Promise<Command> {
    return program.parseAsync(args);
  }

  static parse(args): Command {
    return program.parse(args);
  }
};

export function programCommand(name: string, requireKeyPair: boolean = true) {
  let newProgram = program
    .command(name)
    .option(
      "-e, --env <string>",
      "Solana cluster env name",
      "devnet" //mainnet-beta, testnet, devnet
    )
    .option(
      "-r, --rpc-url <string>",
      "Solana cluster rpc-url"
    )
    .option("-l, --log-level <string>", "log level", setLogLevel);
  
  if (requireKeyPair) {
    return newProgram.requiredOption("-k, --keypair <path>", `Solana wallet location`);
  } else {
    return newProgram.option("-k, --keypair <path>", `Solana wallet location`);
  }
}

function buildProgramCommandWithArgs(name: string, args: Array<Argument>, requireKeyPair?: boolean) {
  let command = programCommand(name, requireKeyPair);

  args.forEach(argument => {
    command = command.addArgument(argument);
  });

  return command;
}

export function programCommandWithArgs(name: string, args: Array<Argument>, action: (...args) => Promise<any>, requireKeyPair?: boolean) {
  return buildProgramCommandWithArgs(name, args, requireKeyPair)
    .action(async function(...args) {
      action(...args);
    });
}

export function programCommandWithConfig(name: string, action: (...args) => Promise<any>, requireKeyPair?: boolean) {
  return programCommandWithArgsAndConfig(name, [], action, requireKeyPair);
}

export function programCommandWithArgsAndConfig(name: string, args: Array<Argument>, action: (...args) => Promise<any>, requireKeyPair?: boolean) {
  return buildProgramCommandWithArgs(name, args, requireKeyPair)
    .requiredOption(
      "-cp, --config-path <string>",
      "JSON file with namespace settings"
    )
    .action(async function(...args) {
      const { configPath } = this.opts();

      if (configPath === undefined) {
        throw new Error("The configPath is undefined");
      }

      const config: any = readConfig(configPath)

      action(config, ...args);
    });
}

function setLogLevel(value: string, _prev: string): string | undefined {
  if (value === undefined || value === null) {
    return;
  }
  log.info("setting the log value to: " + value);
  log.setLevel(value as log.LogLevelDesc);
}

export function readConfig(configFile: string) {
  let config = {};
  if (fs.existsSync(configFile)) {
    config = JSON.parse(fs.readFileSync(configFile, "utf8"));
  } else {
    log.error(`Config file at path '${configFile}' does not exist`);
    throw new Error(`Config file does not exist at path '${configFile}'`);
  }
  return config;
}

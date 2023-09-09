import {Config} from './config';

let configuration: Config | undefined;
const bus = new EventTarget();

function set_configuration(cfg: Config) {
  configuration = cfg;
}

export {configuration, bus, set_configuration, Config};

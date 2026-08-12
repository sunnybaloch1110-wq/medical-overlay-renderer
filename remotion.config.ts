import { Config } from '@remotion/cli/config';

Config.setChromiumMultiProcessOnLinux(true);
Config.setVideoImageFormat('jpeg');
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);

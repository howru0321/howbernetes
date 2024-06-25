import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  runContainer(imageName: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const command = `sudo docker run -d ${imageName}`;
        
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${stderr}`);
        } else {
          const containerId = stdout.trim();
          resolve(containerId);
        }
      });
    });
  }

  removeContainer(containerId: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const command = `sudo docker rm -f ${containerId}`;
        
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Error: ${stderr}`);
        } else {
          resolve(stdout)
        }
      });
    });
  }


}

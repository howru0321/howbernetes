import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

runContainer(containerName: string, imageName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const command = `sudo docker run -d --name ${containerName} ${imageName}`;
      
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(`Error: ${stderr}`);
      } else {
        const containerId = stdout.trim();
        
        const inspectCommand = `sudo docker inspect ${containerId}`;
        
        exec(inspectCommand, (inspectError, inspectStdout, inspectStderr) => {
          if (inspectError) {
            reject(`Error inspecting container: ${inspectStderr}`);
          } else {
            resolve(inspectStdout);
          }
        });
      }
    });
  });
}


}

#!/usr/bin/env node

const { Command } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs');
const yaml = require('js-yaml');
const Configstore = require('configstore');
const pkg = require('./package.json');
const axios = require('axios');
const path = require('path');
const Table = require('cli-table3');

const config = new Configstore(pkg.name);

const program = new Command();

function getMasterNodeConfig() {
  const ip = config.get('master-node').ip;
  const port = config.get('master-node').port;
  if (!ip) {
    throw new Error('master-node server IP address not set. Please run "howbectl master" first.');
  }
  if (!port) {
    throw new Error('master-node server port not set. Please run "howbectl master" first.');
  }
  return { ip, port };
}

program
  .name('howbectl')
  .description('CLI tool to manage deployments and scaling of containers')
  .version('1.0.0');

program
  .command('master')
  .description('Modify a master-node server information')
  .action(async () => {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'masterIp',
        message: 'Enter the master-node server IP address',
        validate: (input) => {
          const valid = /^(\d{1,3}\.){3}\d{1,3}$/.test(input);
          return valid || 'Please enter a valid IP address';
        }
      },
      {
        type: 'input',
        name: 'masterPort',
        message: 'Enter the master-node server port',
        validate: (input) => {
            const port = parseInt(input, 10);
            const valid = port >= 0 && port <= 65535;
            return valid || 'Please enter a valid port number (0-65535)';
        }
      }
    ]);

    config.set('master-node', {
        ip: answers.masterIp,
        port: answers.masterPort
      });
      console.log(`Modify master-node information by IP address ${answers.masterIp} and port ${answers.masterPort}.`);
  });

program
  .command('worker')
  .description('Add a worker-node information')
  .action(async () => {
    let ip, port;
    try {
      ({ ip, port } = getMasterNodeConfig());
    } catch (error) {
      console.error(error.message);
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Enter a worker-node name',
        validate: (input) => {
            const workerNodes = config.get('worker-node') || {};
            if (workerNodes.hasOwnProperty(input)) {
              return 'Name already exists. Please enter a different name.';
            }
            return true;
          }
      },
      {
        type: 'input',
        name: 'workerIp',
        message: 'Enter a worker IP address',
        validate: (input) => {
          const valid = /^(\d{1,3}\.){3}\d{1,3}$/.test(input);
          return valid || 'Please enter a valid IP address';
        }
      },
      {
        type: 'input',
        name: 'workerPort',
        message: 'Enter the worker-node server port',
        validate: (input) => {
            const port = parseInt(input, 10);
            const valid = port >= 0 && port <= 65535;
            return valid || 'Please enter a valid port number (0-65535)';
        }
      }
    ]);

    try {
      const response = await axios.post(`http://${ip}:${port}/worker`, {
        name: answers.name,
        ip: answers.workerIp,
        port: answers.workerPort
      }, {
        'Content-Type': 'application/json'
      });
      console.log('Response:', response.data);

      console.log(`Worker-node ${answers.name} with IP address ${answers.workerIp} and port ${answers.workerPort} added.`);
    } catch (error) {
      console.error('Error:', error.message);
    }
  });


// Run command
program
  .command('run <container>')
  .description('Create and run a particular image')
  .option('--image <number>')
  .action(async (container, options) => {
    let ip, port;
    try {
      ({ ip, port } = getMasterNodeConfig());
    } catch (error) {
      console.error(error.message);
      return;
    }

    const image = options.image;
    if (!container) {
      console.error('Please provide both image and container names in the format howbectl <container>');
      return;
    }
    if (!image) {
      console.error('The --image option is required.');
      return;
    }

    try {
      const response = await axios.post(`http://${ip}:${port}/create/pod`, {
        podName : container,
        containerInfolist : [
          {
            name : container,
            image : image
          },
        ]
      });
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error:', error.message);
    }
    
  });

// Remove command
program
  .command('remove <container>')
  .description('Remove container')
  .action(async (container) => {
    let ip, port;
    try {
      ({ ip, port } = getMasterNodeConfig());
    } catch (error) {
      console.error(error.message);
      return;
    }
    
    if (!container) {
      console.error('Please provide container name in the format howbectl <container>');
      return;
    }

    try {
      const response = await axios.post(`http://${ip}:${port}/remove`, {
        container
      });
      console.log('Response:', response.data);
    } catch (error) {
      console.error('Error:', error.message);
    }
  });


// Create command
program
  .command('create')
  .description('Create a resource from a file')
  .option('-f, --filename <filePath>', 'Path to the YAML file')
  .action(async (cmd) => {
    let filePath = cmd.filename;

    if (!filePath) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'filePath',
          message: 'Please provide the path to the YAML file:',
          validate: (input) => {
            if (fs.existsSync(input)) {
              return true;
            }
            return 'File does not exist. Please provide a valid file path.';
          }
        }
      ]);
      filePath = answers.filePath;
    }

    let ip, port;
    try {
      ({ ip, port } = getMasterNodeConfig());
    } catch (error) {
      console.error(error.message);
      return;
    }

    let data
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      data = yaml.load(fileContents);
    } catch (error) {
      console.error('Error reading or parsing YAML file:', error.message);
    }

    kind = data.kind
    if(kind=="Pod"){
      const podName = data.metadata.name;
      const labels = data.metadata.labels;
      const podLabels = [];
      for (const [key, value] of Object.entries(labels)) {
        const podLabel = {
          key : key,
          value : value
        }
        podLabels.push(podLabel)
      }
      const containerInfolist = data.spec.containers;

      try {
        const response = await axios.post(`http://${ip}:${port}/create/pod`, {
          podName,
          podLabels,
          containerInfolist
        });
        console.log('Response:', response.data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    } else if(kind == "RepliaSet"){
      const replicasetName=data.metadata.name
      const matchlables = data.spec.selector.matchLables;
      const matchLabels = [];
      for (const [key, value] of Object.entries(matchlables)) {
        const matchLabel = {
          key : key,
          value : value
        }
        matchLabels.push(matchLabel)
      }
      const replicas = data.spec.replicas
      const podName = data.spec.template.metadata.name
      const labels = data.spec.template.metadata.labels;
      const podLabels = [];
      for (const [key, value] of Object.entries(labels)) {
        const podLabel = {
          key : key,
          value : value
        }
        podLabels.push(podLabel)
      }
      const containerInfolist = data.spec.template.spec.containers

      try {
        const response = await axios.post(`http://${ip}:${port}/create/replicaset`, {
          replicasetName: replicasetName,
          matchLabels,
          replicas: replicas,
          podInfo:{
            podName : podName,
            podLabels,
            containerInfolist : containerInfolist
          }
        });
        console.log('Response:', response.data);
      } catch (error) {
        console.error('Error:', error.message);
      }
    }
  });

// Define the delete command
const deleteCommand = program.command('delete').description('Delete object');

// Define the delete pod command
deleteCommand
  .command('pod <name>')
  .description('Delete a pod')
  .action(async (name) => {
    await deleteObject('pod', name);
  });

// Define the delete replicaset command
deleteCommand
  .command('replicaset <name>')
  .description('Delete a replicaset')
  .action(async (name) => {
    await deleteObject('replicaset', name);
  });

// Generic function to delete an object
async function deleteObject(type, name) {
  let ip, port;
  try {
    ({ ip, port } = getMasterNodeConfig());
  } catch (error) {
    console.error(error.message);
    return;
  }

  if (!name) {
    console.error(`Please provide the ${type} name in the format howbectl delete ${type} <name>`);
    return;
  }

  try {
    const response = await axios.delete(`http://${ip}:${port}/delete/${type}?&name=${name}`);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

const scaleCommand = program.command('scale').description('Scale an object');

scaleCommand
  .command('replicaset <name>')
  .description('Scale a replicaset')
  .option('--replicas <number>', 'Number of replicas')
  .action(async (name, options) => {
    const replicas = options.replicas;
    if (!replicas) {
      console.error('Error: --replicas option is required');
      process.exit(1);
    }
    await scaleObject(name, replicas);
  });

  // Generic function to delete an object
async function scaleObject(name, replicas) {
  let ip, port;
  try {
    ({ ip, port } = getMasterNodeConfig());
  } catch (error) {
    console.error(error.message);
    return;
  }

  if (!name) {
    console.error(`Please provide the replicaset name in the format howbectl scale replicaset --replicas=<?> <name>`);
    return;
  }

  try {
    const response = await axios.patch(`http://${ip}:${port}/scale/replicaset?&name=${name}&replicas=${replicas}`);
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.message);
  }
}


function getStatus(containerList, totalContainers) {
  const readyContainers = containerList.filter(container => container.id !== null).length;
  const readyStatus = `${readyContainers}/${totalContainers}`;
  const status = readyContainers === totalContainers ? 'COMPLETE' : 'NONCOMPLETE';
  return { readyStatus, status };
}

const getCommand = program.command('get').description("Get object's information");
getCommand
    .command('pod <name>')
    .description('Get pod information')
    .action(async (name) => {
      try {
        ({ ip, port } = getMasterNodeConfig());
      } catch (error) {
        console.error(error.message);
        return;
      }
      console.log(name);
      let podInfo;
      try {
        const response = await axios.get(`http://${ip}:${port}/get/pod?&name=${name}`);
        podInfo = response.data;
      } catch (error) {
        console.error('Error:', error.message);
      }
      const key = podInfo.key;
      const {containers, containeridlist, workernode, replicaset} = podInfo.value;
      const { readyStatus, status } = getStatus(containeridlist, containers);

      const table = new Table({
          head: ['NAME', 'READY', 'STATUS', 'WORKER NODE', 'REPLICA SET'],
          colWidths: [30, 10, 15, 20, 20]
      });

      table.push(
          [key, readyStatus, status, workernode, replicaset]
      );

      console.log(table.toString());
    });

  getCommand
    .command('replicaset <name>')
    .description('Get replicaset information')
    .action(async (name) => {
      try {
        ({ ip, port } = getMasterNodeConfig());
      } catch (error) {
        console.error(error.message);
        return;
      }
      let replicasetInfo;
      try {
        const response = await axios.get(`http://${ip}:${port}/get/replicaset?&name=${name}`);
        replicasetInfo = response.data;
      } catch (error) {
        console.error('Error:', error.message);
      }
      const key = replicasetInfo.key;
      const { replicas, podidlist } = replicasetInfo.value;

      const table = new Table({
          head: ['NAME', 'DESIREED', 'CURRENT'],
          colWidths: [30, 10, 15]
      });

      table.push(
          [key, replicas, podidlist.length]
      );

      console.log(table.toString());
    });

program.parse(process.argv);
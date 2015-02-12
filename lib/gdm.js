/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var spawn = require('child_process').spawn;
var fs = require('fs');
var path = require('path');

var git_modules = './git_modules';

if(!fs.existsSync(git_modules)){
  fs.mkdirSync(git_modules);
}

var syncRepository = function(repo, branch, path, done){

  console.log('sync ' + repo + '#' + branch + ' to ' + path);

  var dirName = git_modules + '/' + path;
  var git;

  var gitHandlers = function(process, cb){
    process.stdout.on('data', function(data) {
      console.log('stdout: ' + data);
    });
    process.stderr.on('data', function(data) {
      console.log('stderr: ' + data);
    });
    process.on('close', function(code) {
      console.log('child process exited with code ' + code);
      done();

      // commented npm. Thinking about making it optional.
      /*var npm = spawn('npm', ['install'], {cwd: dirName});
      npm.stdout.on('data', function(data) {
        console.log('stdout: ' + data);
      });
      npm.stderr.on('data', function(data) {
        console.log('stderr: ' + data);
      });
      npm.on('close', function(code) {
        console.log('child process exited with code ' + code);
        done();
      });*/
    });
  }

  if(fs.existsSync(dirName)){
    git = spawn('git', ['pull', 'origin'], {cwd: git_modules});
    gitHandlers(git);
  }else{
    if(branch){
      git = spawn('git', ['clone', '-b', branch, repo, path], {cwd: git_modules});
    }else{
      git = spawn('git', ['clone', repo, path], {cwd: git_modules});
    }
    gitHandlers(git);
  }
};

var run = function(done){
  var json = JSON.parse(fs.readFileSync('./package.json').toString());
  var dependencies = [];
  for(dependency in json.gitDependencies){
    var repo = json.gitDependencies[dependency];
    var isBranch = repo.indexOf('#') !== -1;
    var branch = null;
    if(isBranch){
      branch = repo.split('#')[1];
      repo = repo.split('#')[0];
    }
    dependencies.push({
      repo: repo,
      branch: branch,
      dependency: dependency
    });
  }
  var sync = function(){
    if(dependencies.length > 0){
      var o = dependencies.pop();
      syncRepository(o.repo, o.branch, o.dependency, sync);
    }else{
      if(done !== undefined){
        done();
      }
      console.log('done');
    }
  };
  sync();

};

module.exports = {
  run: run
};
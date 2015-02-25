/*
Copyright (c) 2015, salesforce.com, inc. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

var fs = require('fs');
var git = require('gulp-git');

var git_modules = './git_modules';

if(!fs.existsSync(git_modules)){
  fs.mkdirSync(git_modules);
}

/**
* @project Name of the git repository under the ux organization
* @branch Name of the branch
* @dependency Name and path where to check it out
* @done Callback
*/
var syncRepository = function(repo, branch, dependency, done){
  var dirName = git_modules + '/' + dependency;

  console.log('GDM ' + repo + '#' + branch + ' -> ' + dirName);

  if(fs.existsSync(dirName)){
    git.pull('origin', branch, {cwd: dirName}, function (err) {
      if(err){
        console.log('ERROR: pull ' + branch + ' failed: ' + err);
      }
      done();
    });
  }else{
    git.clone(repo, {cwd: git_modules, args: '-b ' + branch + ' ' + dependency}, function(err){
      if(!err){
        done();
      }else{
        console.log('ERROR: cloning ' + repo + ' failed: ' + err);
        done();
      }
    });
  }
};

var run = function(done){
  var json = JSON.parse(fs.readFileSync('./package.json').toString());
  var dependencies = [];
  for(dependency in json.gitDependencies){
    var repo = json.gitDependencies[dependency];
    var isBranch = repo.indexOf('#') !== -1;
    if(isBranch){
      dependencies.push({
        repo: repo.split('#')[0],
        branch: repo.split('#')[1],
        dependency: dependency
      });
    }else{
      throw new Error('No branch specified for ' + repo);
    }
  }
  var sync = function(){
    if(dependencies.length > 0){
      var o = dependencies.pop();
      syncRepository(o.repo, o.branch, o.dependency, sync);
    }else{
      if(done !== undefined){
        done();
      }
    }
  };
  sync();

};

module.exports = {
  run: run
};
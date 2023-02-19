'use strict';
document.addEventListener('DOMContentLoaded', Load);
document.getElementById('save_button').addEventListener('click', saveRedmineInfo);　
document.getElementById('clear_button').addEventListener('click', clearRedmineInfo);　

function clearRedmineInfo() {
  chrome.storage.local.set({'Credentials': undefined}, function () {
	  console.log("clear success");
  });
}

function saveRedmineInfo() {
  var token = document.getElementById('input_token').value; 
  var url = document.getElementById('input_url').value; 
  var projectId = document.getElementById('input_project_id').value; 
  var trackerId = document.getElementById('input_tracker_id').value; 
  chrome.storage.local.set({'Credentials': {'token': token, 'url': url, 'projectId': projectId, 'trackerId': trackerId}}, function () {
	  console.log("store success");
  });  //
}

async function init(items){
        const tab = await getCurrentTab();
        await chrome.scripting.executeScript(
            {
              target: { tabId: tab.id },
              func: call,
              args: [items.Credentials]
            },
            showResult
        )
}

function Load() {
  chrome.storage.local.get('Credentials', function (items) {
    if (items.Credentials == undefined){
    } else {
        document.getElementById('input_token').value = items.Credentials.token; 
        document.getElementById('input_url').value = items.Credentials.url; 
        document.getElementById('input_project_id').value = items.Credentials.projectId;
        document.getElementById('input_tracker_id').value = items.Credentials.trackerId;
	init(items);
    }
  });
}

function showResult(result) {
    let item = result[0].result;
    if (item){
        document.getElementById('result').value = 'Success';
    } else {
        document.getElementById('result').value = 'Failed';
    }

}

function call(obj){
  if (window.location.host != 'chat.openai.com') {
      document.getElementById('result').value = 'Work only chat.openai.com'; 
      return false;
  }
  console.log(window.location.host);
  const apiKey = obj.token;
  const url = obj.url;
  const projectId = obj.projectId;
  const endpoint = url + '/issues.json';
  const docSize = document.getElementsByClassName("text-base").length;
  const title = document.getElementsByClassName("text-base")[docSize-2].textContent;
  const q = document.getElementsByClassName("text-base")[docSize-2].textContent;
  const a = document.getElementsByClassName("text-base")[docSize-1].innerText;
  const data = {
    issue: {
      project_id: projectId,
      tracker_id: obj.trackerId,
      subject: 'Q: '+title,
      description: q+'\n'+a,
      status_id: 1
    }
  };
  const xhr = new XMLHttpRequest();
  xhr.open('POST', endpoint);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('X-Redmine-API-Key', apiKey);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 201) {
      const response = JSON.parse(xhr.responseText);
      console.log('Created new ticket. ticket number: ', response.issue.id);
      //return('Success save to Redmine'); 
       return true;
    } else if (xhr.readyState === 4) {
      console.error('Create ticket failed. statuus code:', xhr.status, ' error message:', xhr.responseText);
      //return('save failed: message '+xhr.responseText); 
       return false;
    }
  };
  xhr.send(JSON.stringify(data));
}

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

// @ts-nocheck
import axios, { AxiosRequestConfig } from 'axios';
import $ from 'jquery';

var ListenerTracker=new function(){
    var targets=[];
    // listener tracking datas
    var _elements_  =[];
    var _listeners_ =[];
    this.init=function(){
        this.listen(Element,window);
    };
    this.listen=function(){
        for(var i=0;i<arguments.length;i++){
            if(targets.indexOf(arguments[i])===-1){
                targets.push(arguments[i]);//avoid duplicate call
                intercep_events_listeners(arguments[i]);
            }
        }
    };
    // register individual element an returns its corresponding listeners
    var register_element=function(element){
        if(_elements_.indexOf(element)==-1){
            // NB : split by useCapture to make listener easier to find when removing
            var elt_listeners=[{/*useCapture=false*/},{/*useCapture=true*/}];
            _elements_.push(element);
            _listeners_.push(elt_listeners);
        }
        return _listeners_[_elements_.indexOf(element)];
    };
    var intercep_events_listeners = function(target){
        var _target=target;
        if(target.prototype)_target=target.prototype;
        if(_target.getEventListeners)return;
        if(typeof(_target.addEventListener)!=='function'||typeof(_target.removeEventListener)!=='function'){
            console.log('target=',target);
            throw('\nListenerTracker Error:\nUnwrappable target.');
        }
        // backup overrided methods
        var _super_={
            "addEventListener"      : _target.addEventListener,
            "removeEventListener"   : _target.removeEventListener
        };

        _target["addEventListener"]=function(type, listener, useCapture){
            var listeners=register_element(this);
            // add event before to avoid registering if an error is thrown
            _super_["addEventListener"].apply(this,arguments);
            // adapt to 'elt_listeners' index
            var uc=(typeof(useCapture)==='object'?useCapture.useCapture:useCapture)?1:0;
            if(!listeners[uc][type])listeners[uc][type]=[];
            listeners[uc][type].push({cb:listener,args:arguments});
        };
        _target["removeEventListener"]=function(type, listener, useCapture){
            var listeners=register_element(this);
            // add event before to avoid registering if an error is thrown
            _super_["removeEventListener"].apply(this,arguments);
            // adapt to 'elt_listeners' index
            useCapture=(typeof(useCapture)==='object'?useCapture.useCapture:useCapture)?1:0;
            if(!listeners[useCapture][type])return;
            var lid = listeners[useCapture][type].findIndex(obj=>obj.cb===listener);
            if(lid>-1)listeners[useCapture][type].splice(lid,1);
        };
        _target["getEventListeners"]=function(type){
            var listeners=register_element(this);
            // convert to listener datas list
            var result=[];
            for(var useCapture=0,list;list=listeners[useCapture];useCapture++){
                if(typeof(type)=="string"){// filtered by type
                    if(list[type]){
                        for(var id in list[type]){
                            result.push({
                                "type":type,
                                "listener":list[type][id].cb,
                                "args":list[type][id].args,
                                "useCapture":!!useCapture
                            });
                        }
                    }
                }else{// all
                    for(var _type in list){
                        for(var id in list[_type]){
                            result.push({
                                "type":_type,
                                "listener":list[_type][id].cb,
                                "args":list[_type][id].args,
                                "useCapture":!!useCapture
                            });
                        }
                    }
                }
            }
            return result;
        };
    };

}();


ListenerTracker.init();

(async function() {
  // const axiosSrc = chrome.extension.getURL('/axios.min.js')
  // const axiosSrc = chrome.extension.getURL('/axios.min.js')
  // const axios = await import('axios');
  // const $ = await import('jquery');
  // let suggestions;
  const slackTextInputId = 'slackTextInput';
  const suggestionContainerId = 'suggestionContainer';
  const suggestionListId = 'suggestionList';
  const floatingButtonId = 'floatingButton';

  let isOpen = false;

  function floatingWidgetButton() {
    const newInput = document.createElement('button');
    const closeButton = document.createElement('button');
    const floatingUI = document.createElement('div');
    newInput.id = floatingButtonId;
    newInput.style.width = '80px';
    newInput.style.height = '80px';
    newInput.style.borderRadius = '40px';

    function resetButton() {
      newInput.innerText = "";
      newInput.style.background = "url(https://raw.githubusercontent.com/jasonljin/slack-copilot/main/icons/bu-logo-avatar.png)";
      newInput.style.backgroundSize = "contain";
    }
    // slackInput.style.padding = '8px';
    // slackInput.textContent = 'Copilot enabled... Start typing to get real-time coaching as you type.';
    resetButton()
    
    newInput.style.border = 'rgba(206, 0, 88, 0.8) 2px solid'; // converted to RGBA
    newInput.style.zIndex = '9999';
    newInput.style.left = '40px';
    newInput.style.bottom = '40px';
    newInput.style.display = 'block';
    newInput.style.position = 'fixed';

    const iframe = document.createElement('iframe')
    iframe.style.width = '500px';
    iframe.style.height = '800px';
    iframe.style.zIndex = '9999';
    iframe.style.left = '40px';
    iframe.style.bottom = '120px';
    iframe.style.display = 'block';
    iframe.style.position = 'fixed';

    newInput.addEventListener('click', (evt) => {
      evt.preventDefault()
      chrome.runtime.sendMessage({ open: true }, (response) => {
        // isOpen = !isOpen
        iframe.src = "https://swordfish-next.vercel.app/embed"
        if (newInput.innerHTML == "Close") {
          floatingUI.removeChild(iframe)
          resetButton()
        } else {
          floatingUI.appendChild(iframe)
          newInput.innerText = "Close";
          newInput.style.background = "#fff";
          newInput.style.color = "#000";

        }
      })
    })
 
    floatingUI.appendChild(newInput);
    document.body.appendChild(floatingUI);
  }

  function overrideSlackTextInput() {

    const slackInput = document.querySelector('[data-qa="message_input"]') as HTMLElement;
    if (!slackInput) {
      handleError('Failed to override Slack text input box. Disabling extension.');
      return;
    }

    // slackInput.style.backgroundColor = '#fff';
    // slackInput.style.border = '1px solid #00f';

    // const newInput = document.createElement('textarea');
    slackInput.id = slackTextInputId;
    slackInput.style.width = '100%';
    slackInput.style.height = '100%';
    // slackInput.style.padding = '8px';
    // slackInput.textContent = 'Copilot enabled... Start typing to get real-time coaching as you type.';
    // newInput.style.backgroundColor = '#fff';
    slackInput.style.border = 'rgba(206, 0, 88, 0.8) 2px solid'; // converted to RGBA
    slackInput.style.borderRadius = '4px';
    slackInput.style.zIndex = '999';
    // slackInput.style.resize = 'none';
    // slackInput.appendChild(newInput);
 
    // Get all the observers on slackInput
    // const observers = getEventListeners(slackInput);
    // // console.log("slack input observers", observers)
    // // Replace slackInput with newInput
    // slackInput.replaceChildren(newInput);

    // // Add all the observers to newInput
    // observers.input.forEach(observer => {
    //   newInput.addEventListener('input', observer.listener);
    // });
    // observers.keydown.forEach(observer => {
    //   console.log("add keydown observer")
    //   newInput.addEventListener('keydown', observer.listener);
    // });
    // observers.keyup.forEach(observer => {
    //   newInput.addEventListener('keyup', observer.listener);
    // });
    // observers.paste.forEach(observer => {
    //   newInput.addEventListener('paste', observer.listener);
    // });

    // newInput.addEventListener('keydown', (event) => {
    //   if (event.keyCode === 13) {
    //     // alert("pressed enter!")
    //     event.preventDefault();
    //     // const inputEvent = new Event('input', { bubbles: true });
    //     // slackInput.dispatchEvent(inputEvent);
    //   }
    // });

    // slackInput.parentElement.replaceChild(newInput, slackInput);
  }

  function fetchGPT4Suggestions(inputText) {
    console.log("input text:", inputText)
    return new Promise(async (resolve, reject) => {
      try {
        const apiKey = await new Promise((resolve, reject) => {
          chrome.storage?.sync.get(['apiKey'], (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result.apiKey);
            }
          });
        });

        let prompt = `You're a communication coach bot, designed to help your client be more persuasive, thoughtful, and inspiring, as they're messaging their teammates on Slack. 
        Below is the message that they're typing currently, give your best recommendation for how to make it more thoughtful, persuasive, or inspiring:`
        let body = {
          model: "text-davinci-003", 
          prompt: `${prompt}
          ${inputText}`,
          max_tokens: 400,
          n: 1,
          stop: null,
          temperature: 0.7,
        }
        let url = 'https://api.openai.com/v1/completions'
        // let request: AxiosRequestConfig = {
        //     data: body as any,
        //     headers: {
        //         'Authorization': `Bearer ${apiKey}`,
        //         'Content-Type': 'application/json',
        //     }
        // }
        let headers = {
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            }
        }
        let request = {
            // method: 'post', // Add the method property
            url: url, // Add the url property
            data: body as any,
        };
        console.log("sending req to openAPI", request)
        const response = await axios.post(url, body, headers);
        let suggestions = response.data.choices.map(choice => choice.text.trim())
        resolve(suggestions);
      } catch (error) {
        console.log("error fetching suggestion", error)
        reject(error);
      }
    });
  }

  function displaySuggestions(suggestions) {
    console.log("displaying suggestions:", suggestions)
    let suggestionContainer = document.getElementById(suggestionContainerId);
    let suggestionList = document.getElementById(suggestionListId);
    if (!suggestionContainer) {
      suggestionContainer = document.createElement('div');
      suggestionContainer.id = suggestionContainerId;
      suggestionContainer.style.position = 'absolute';
      suggestionContainer.style.zIndex = '1000';
      suggestionContainer.style.backgroundColor = '#CE0058';
      suggestionContainer.style.border = '1px solid #fff';
      suggestionContainer.style.borderRadius = '4px';
      suggestionContainer.style.padding = '10px';
      suggestionContainer.style.width = '300px';
      suggestionContainer.style.display = 'none';

      document.body.appendChild(suggestionContainer);
    }
    if (!suggestionList) {
      suggestionList = document.createElement('ul');
    }
    suggestionList.id = suggestionListId;
    suggestionList.style.listStyleType = 'none';
    suggestionList.style.padding = '0px';
    suggestionList.style.margin = '0px';

    suggestionContainer.appendChild(suggestionList);

    // const suggestionList = document.getElementById(suggestionListId);
    // if (suggestionList) {
      // suggestionList.innerHTML = '';
    // }

    suggestions?.forEach(suggestion => {
      const listItem = document.createElement('li');
      listItem.textContent = suggestion;
      listItem.style.cursor = 'pointer';
      listItem.style.padding = '5px 0';
      listItem.style.overflowY = 'scroll';
      listItem.addEventListener('click', () => {
        let slackTextInput = document.getElementById(slackTextInputId)
        let slackTextEditor = slackTextInput.querySelector('.ql-editor') as Element;

        let childParagraph = document.createElement('p');
        childParagraph.innerText = suggestion;
        slackTextEditor.replaceChildren(childParagraph);
        suggestionContainer.style.display = 'none';
      });

      console.log("suggestionList", suggestionList)

      suggestionList.appendChild(listItem);
    });

    suggestionContainer.style.height = '80px';
    suggestionContainer.style.width = '400px';
    suggestionContainer.style.right = '16px';
    suggestionContainer.style.bottom = '80px';
    suggestionContainer.style.display = 'block';
  }

  function handleError(errorMessage) {
    console.error(errorMessage);
    // alert(errorMessage);
  }


  window.addEventListener('load', () => {
    setTimeout(() => {
      floatingWidgetButton();
      overrideSlackTextInput();
    }, 1000)
  });


  function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(this, args);
      }, delay);
    };

  };
  let timeoutId;
  $(document).on('input', `#${slackTextInputId}`, async (event) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(async () => {
        try {
          console.log("event value innerText", event.target.textContent)
        const inputText = event.target.textContent;
        console.log("inputText", inputText, inputText.length)
        if (inputText.length < 20) {
          if (inputText.trim() === '') {
            document.getElementById(suggestionContainerId).style.display = 'none';
            return;
          }
          return;
        } else {
          // let suggestions = [
          //   // `Try: "I'm testing autocompletion to make sure our team's messages are accurate and efficient."`,
          //   // `Try: "Testing our new autocomplete feature - I'm e…o see how this can help streamline our workflow!"`
          // ]
          let suggestionContainer = document.getElementById(suggestionContainerId);
          if (suggestionContainer) {
            suggestionContainer.style.display = 'block';
            suggestionContainer.innerText = "Thinking..."
          }

          const suggestions = await fetchGPT4Suggestions(inputText);
          // const debouncedFetch = debounce(fetchGPT4Suggestions, 10000);
          // await debouncedFetch(inputText);
          console.log("suggestions", suggestions)
          // if (suggestions && suggestions.length > 0) {
          displaySuggestions(suggestions);
          // }
        }

      } catch (error) {
        handleError('Failed to fetch suggestions from GPT-4 API: ' + error);
      }
    }, 3000)
      
  });

})();

export {}

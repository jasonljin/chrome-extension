// @ts-nocheck
import axios, { AxiosRequestConfig } from 'axios';
import $ from 'jquery';

(async function() {
  // const axiosSrc = chrome.extension.getURL('/axios.min.js')
  // const axiosSrc = chrome.extension.getURL('/axios.min.js')
  // const axios = await import('axios');
  // const $ = await import('jquery');
  // let suggestions;
  let slackInput;
  let floatingUI;
  let floatingButton;
  let floatingToastNotification;
  const slackTextInputId = 'slackTextInput';
  const suggestionContainerId = 'suggestionContainer';
  const suggestionListId = 'suggestionList';
  const floatingButtonId = 'floatingButton';

  let isOpen = false;

  function setupStyling() {
    const style = document.createElement('style');
    style.innerHTML = `
        @property --angle {
        syntax: '<angle>';
        initial-value: 90deg;
        inherits: true;
        }

        @property --gradX {
        syntax: '<percentage>';
        initial-value: 50%;
        inherits: true;
        }

        @property --gradY {
        syntax: '<percentage>';
        initial-value: 0%;
        inherits: true;
        }

        :root {
            --d: 2500ms;
            --angle: 90deg;
            --gradX: 100%;
            --gradY: 50%;
            --c1: rgba(255, 255, 173, 0.5);
            --c2: rgba(206, 0, 88, 0.3);
        }

        @keyframes borderRotate {
            100% {
                --angle: 420deg;
            }
        }
        @keyframes borderRadial {
            20% {
                --gradX: 100%;
                --gradY: 50%;
            }
            40% {
                --gradX: 100%;
                --gradY: 100%;
            }
            60% {
                --gradX: 50%;
                --gradY: 100%;
            }
            80% {
                --gradX: 0%;
                --gradY: 50%;
            }
            100% {
                --gradX: 50%;
                --gradY: 0%;
            }
        }
    `;
    document.head.appendChild(style);
  }

  function floatingWidgetButton() {
    floatingButton = document.createElement('button');
    const closeButton = document.createElement('button');
    floatingUI = document.createElement('div');
    floatingButton.id = floatingButtonId;
    floatingButton.style.width = '80px';
    floatingButton.style.height = '80px';
    floatingButton.style.borderRadius = '40px';

    function resetButton() {
      floatingButton.innerText = "";
      floatingButton.style.background = "url(https://raw.githubusercontent.com/jasonljin/slack-copilot/main/public/icons/bu-logo-avatar.png)";
      floatingButton.style.backgroundSize = "contain";
    }
    // slackInput.style.padding = '8px';
    // slackInput.textContent = 'Copilot enabled... Start typing to get real-time coaching as you type.';
    resetButton()
    
    floatingButton.style.border = 'rgba(206, 0, 88, 0.5) 2px solid'; // converted to RGBA
    floatingButton.style.zIndex = '10001';
    floatingButton.style.left = '40px';
    floatingButton.style.bottom = '40px';
    floatingButton.style.display = 'block';
    floatingButton.style.position = 'fixed';

    floatingToastNotification = document.createElement('div');
    floatingToastNotification.style.position = 'absolute';
    floatingToastNotification.style.left = '0';
    floatingToastNotification.style.bottom = '130px';
    floatingToastNotification.style.padding = '10px';
    floatingToastNotification.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    floatingToastNotification.style.border = '1px solid rgba(206, 0, 88, 0.1)';
    floatingToastNotification.style.color = '#000';
    floatingToastNotification.style.borderRadius = '25px';
    floatingToastNotification.style.zIndex = '10001';
    floatingToastNotification.style.transform = 'scaleX(0)';
    floatingToastNotification.style.transformOrigin = 'left';
    floatingToastNotification.style.transition = 'transform 0.5s ease-out';
    document.body.appendChild(floatingToastNotification);

    setTimeout(() => {
        floatingToastNotification.style.transform = 'scaleX(1)';
        floatingToastNotification.style.left = '40px';
    }, 100);
    setTimeout(() => {
        floatingToastNotification.style.display = 'none';
    }, 4000);

    const iframe = document.createElement('iframe')
    iframe.style.width = '500px';
    iframe.style.height = '800px';
    iframe.style.zIndex = '10001';
    iframe.style.left = '40px';
    iframe.style.bottom = '120px';
    iframe.style.display = 'block';
    iframe.style.position = 'fixed';
    iframe.style.border = "none";
    iframe.style.frameBorder = "none";
    iframe.style.backgroundColor = "white";

    function createCoachingPromptFromURL(url) {
        let topic = encodeURIComponent(`better improving my performance, productivity and communication on the website: "${url}". Categorize the URL to a specific topic of productivity of collaboration, communication, composition, project management, 
        and provide relevant coaching and expertise relevant to that website and the categorized topic. Ask the user how you can help them on their current task on this website`)
        return topic
    }

    // let activeUrl;
    async function getCurrentTab() {
        let queryOptions = { active: true, currentWindow: true };
        let tabs = await chrome.tabs.query(queryOptions);
        return tabs[0].url;
    }
    // chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    //     console.log(tabs[0].url);
    //     activeUrl = tabs[0].url
    // });

    const onPressFloatingActionButton = (event: MouseEvent) => {
        event.preventDefault();
        //   iframe.style.display = "none";
        // const loadingAnimation = document.createElement("div");
        // loadingAnimation.style.width = "50px";
        // loadingAnimation.style.height = "50px";
        // loadingAnimation.style.border = "5px solid rgba(206, 0, 88, 0.5)";
        // loadingAnimation.style.borderTop = "5px solid #fff";
        // loadingAnimation.style.borderRadius = "50%";
        // loadingAnimation.style.animation = "spin 1s linear infinite";
        // loadingAnimation.style.position = "fixed";
        // loadingAnimation.style.left = "40px";
        // loadingAnimation.style.bottom = "120px";
        // loadingAnimation.style.zIndex = "9999";
        // floatingUI.appendChild(loadingAnimation);

        iframe.onload = () => {
            // loadingAnimation.style.display = "none";
            iframe.style.display = "block";
        };

        chrome.runtime.sendMessage({ open: true }, (response) => {

            // isOpen = !isOpen
            iframe.src = `https://swordfish-next.vercel.app/embed?blogTitle=${createCoachingPromptFromURL(window.location.origin)}`;
            // getCurrentTab()
            //     .then((activeUrl) => { 
            //         alert("activeUrl", activeUrl)
            //     })
            //     .then(() => { console.log('error')});
            if (floatingButton.classList.contains('popup-window-open')) {
                floatingUI.removeChild(iframe);
                floatingButton.classList.remove('popup-window-open');
                resetButton();
            } else {
                floatingUI.appendChild(iframe);
                floatingButton.classList.add('popup-window-open');

                floatingButton.style.backgroundImage = "url(https://raw.githubusercontent.com/jasonljin/slack-copilot/main/public/icons/minimize.svg)";
                floatingButton.style.backgroundPosition = "center";
                floatingButton.style.backgroundRepeat = "no-repeat";
                floatingButton.style.backgroundColor = "white";
                //   floatingButton.style.background = "#9f9f9f";
                floatingButton.style.color = "#000";

            }
        });
    }
    floatingButton.addEventListener('click', onPressFloatingActionButton)
 
    floatingUI.appendChild(floatingButton);
    document.body.appendChild(floatingUI);


  }

  async function parseCurrentHTML() {
    const captureContextFromPage = () => {
      const elements = Array.from(document.querySelectorAll('body *'));
      const rankedElements = elements.map(element => {
        const importanceScore = element.getBoundingClientRect().height * element.getBoundingClientRect().width;
        return { element, importanceScore };
      }).sort((a, b) => b.importanceScore - a.importanceScore);

      const topElements = rankedElements.slice(0, 5).map(item => item.element);
      const context = topElements.map(element => element.textContent).join('\n');
      return context;
    };

    const getContextAndFetchGPT4 = async () => {
      const context = captureContextFromPage();
      const prompt = `You're an expert web scraper, that is trained to take in an HTML page, and predict what the user is currently doing. Below is the HTML page the user is currently on:\n${context}\nWhat is the user currently doing on the page?`;
      const suggestions = await fetchGPT4(prompt);
      return suggestions;
    };
    return await getContextAndFetchGPT4()
  }


  function isSupportedWebsite() {
    const supportedWebsites = [
      'slack.com',
      'mail.google.com',
      'linkedin.com',
      'meet.google.com',
      'calendar.google.com',
    ];

    return supportedWebsites.some(website => window.location.origin.includes(website));
  }

  function overrideSlackTextInput() {

    slackInput = document.querySelector('[data-qa="message_input"]') as HTMLElement;
    if (!slackInput) {
      handleError('Failed to override Slack text input box. Disabling extension.');
      return;
    }

    // slackInput.style.backgroundColor = '#fff';
    // slackInput.style.border = '1px solid #00f';

    // const floatingButton = document.createElement('textarea');
    slackInput.id = slackTextInputId;
    slackInput.style.width = '100%';
    slackInput.style.height = '100%';
    // slackInput.style.padding = '8px';
    // slackInput.textContent = 'Copilot enabled... Start typing to get real-time coaching as you type.';
    // newInput.style.backgroundColor = '#fff';
    slackInput.style.border = 'rgba(255, 255, 255, 0.3) 2px solid'; // converted to RGBA
    slackInput.style.borderRadius = '4px';
    slackInput.style.zIndex = '999';
  }

  async function fetchGPT4(prompt, params={
    model: "text-davinci-003", 
    max_tokens: 400,
    n: 1,
    stop: null,
    temperature: 0.7,
  }, apiKey) {
    let url = 'https://api.openai.com/v1/completions'
      let headers = {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        }
    }

    
    let body = {
        ...params,
        prompt: `${prompt}`,
    }

     let request = {
            // method: 'post', // Add the method property
        url: url, // Add the url property
        data: body as any,
    };
    console.log("sending req to openAPI", request)
    const response = await axios.post(url, body, headers);
    let suggestions = response.data.choices.map(choice => choice.text.split("Suggestion:").map(x => x.trim())).flat()
    return suggestions
  }
  async function fetchChatCompletions(prompt, params={
    model: "gpt-3.5-turbo",
    max_tokens: 400,
    n: 1,
    stop: null,
    temperature: 0.7,
  }, apiKey) {
    let url = 'https://api.openai.com/v1/chat/completions'
      let headers = {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        }
    }


    let body = {
        ...params,
        messages: [
            {
                "role": "system", "content": `${prompt}`
            }
        ],
    }

    let request = {
            // method: 'post', // Add the method property
        url: url, // Add the url property
        data: body as any,
    };
    
    console.log("sending req to openAPI", request)
    const response = await axios.post(url, body, headers);
    let thoughts = response.data.choices.map(choice => choice.message.content.split("Suggestion:").map(x => x.trim())).flat().filter(text => text.includes("Thought:"));
    let suggestions = response.data.choices.map(choice => choice.message.content.split("Suggestion:").map(x => x.trim())).flat().filter(text => !text.includes("Thought:"));
    return { suggestions, thoughts }
  }

  function fetchGPT4MessageSuggestions(inputText) {
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
        Think through what the best recommendation you can provide and share those "thoughts" with the prefix "Thought:". Then provide the new message prefixed with "Suggestion:".
        Below is the message that they're typing currently, give your best recommendation for how to make it more thoughtful, persuasive, or inspiring:`
        let params = {
          model: "gpt-3.5-turbo", 
          max_tokens: 400,
          n: 1,
          stop: null,
          temperature: 0.7,
        }

        let joinedPrompt = `${prompt}
        ${inputText}`

        let { suggestions, thoughts } = await fetchChatCompletions(joinedPrompt, params, apiKey)       
        resolve({ suggestions, thoughts });
      } catch (error) {
        console.log("error fetching suggestion", error)
        reject(error);
      }
    });
  }

  function displaySuggestions(suggestions, thoughts) {
    console.log("displaying suggestions:", suggestions)
    let suggestionContainer = document.getElementById(suggestionContainerId);
    let suggestionList = document.getElementById(suggestionListId);
    if (!suggestionContainer) {
      suggestionContainer = document.createElement('div');
      suggestionContainer.id = suggestionContainerId;
      suggestionContainer.style.position = 'absolute';
        suggestionContainer.style.left = "40px";
        suggestionContainer.style.bottom = "160px";
      suggestionContainer.style.zIndex = '1000';
    suggestionContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    suggestionContainer.style.color = '#ffffff';
    suggestionContainer.style.backdropFilter = 'blur(10px)';
    suggestionContainer.style.border = '2px solid rgba(206, 0, 88, 0.5)';
      suggestionContainer.style.borderRadius = '4px';
      suggestionContainer.style.padding = '0px';
      suggestionContainer.style.width = '500px';
      suggestionContainer.style.height = '500px';
      suggestionContainer.style.display = 'block';

      floatingUI.appendChild(suggestionContainer);
    //   slackTextInputId.appendChild(suggestionContainer);
    }

    let suggestionsContainerHeading;
    suggestionsContainerHeading = document.createElement('div');
    suggestionsContainerHeading.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    suggestionsContainerHeading.style.color = '#ffffff';
    suggestionsContainerHeading.style.backdropFilter = 'blur(10px)';
    suggestionsContainerHeading.style.padding = '12px';
    suggestionsContainerHeading.style.fontSize = '14px';
    suggestionsContainerHeading.textContent = 
    'Showing suggestions to be more persuasive to a leadership audience';

    // const divider = document.createElement('hr');
    // divider.style.border = '1px solid gray';
    // divider.style.marginTop = '4px';
    // divider.style.marginBottom = '4px';

    suggestionContainer.appendChild(suggestionsContainerHeading);
    // suggestionContainer.appendChild(divider);
    

    if (!suggestionList) {
      suggestionList = document.createElement('ul');
    }
    suggestionList.id = suggestionListId;
    suggestionList.style.listStyleType = 'none';
    suggestionList.style.padding = '12px';
    suggestionList.style.margin = '0px';

    suggestionContainer.appendChild(suggestionList);

    // const suggestionList = document.getElementById(suggestionListId);
    // if (suggestionList) {
      // suggestionList.innerHTML = '';
    // }

    suggestions?.forEach((suggestion, i) => {
      const listItem = document.createElement('li');
      let thought = thoughts[i]
        if (thought) {
        const subheading = document.createElement('div');
        subheading.textContent = thought.replace("Thought:", "");
        subheading.style.fontSize = '12px';
        subheading.style.fontWeight = 'bold';
        subheading.style.padding = '12px';
        subheading.style.borderRadius = '8px';
        subheading.style.marginBottom = '4px';
        subheading.style.backgroundColor = 'rgba(206, 0, 88, 0.2)';
        subheading.style.color = '#fff';
        subheading.style.position = 'absolute';
        subheading.style.bottom = '0px'
        suggestionContainer.appendChild(subheading);
      }
      const suggestionParagraph = document.createElement('p');
      suggestionParagraph.innerText = suggestion;
      suggestionParagraph.style.color = '#fff'
      suggestionParagraph.style.fontSize = '16px';
      listItem.appendChild(suggestionParagraph);
      listItem.style.height = '100%';
      listItem.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      listItem.style.border = '2px #E7E6E7';
      listItem.style.borderRadius = '8px';
      listItem.style.cursor = 'pointer';
      listItem.style.padding = '12px';
      listItem.style.overflowY = 'scroll';
      listItem.addEventListener('click', () => {
        let slackTextInput = document.getElementById(slackTextInputId)
        let slackTextEditor = slackTextInput.querySelector('.ql-editor') as Element;

        let childParagraph = document.createElement('p');
        childParagraph.innerText = suggestion;
        slackTextEditor.replaceChildren(childParagraph);
        suggestionContainer.style.display = 'none';
        floatingToastNotification.style.display = 'block';
        floatingToastNotification.innerText = 'Navigation complete! Good luck on your journey.'
        setTimeout(() => {
            floatingToastNotification.style.display = 'none';
        }, 5000)
      });
 

      console.log("suggestionList", suggestionList)

      suggestionList.appendChild(listItem);
    });
  }

  function hideSuggestions() {
    const suggestionContainer = document.getElementById(suggestionContainerId);
    if (floatingToastNotification) {
        floatingToastNotification.style.display = 'none';
        floatingToastNotification.innerText = 'Lighthouse is plotting the course...'
    }
    if (suggestionContainer) {
      suggestionContainer.remove();
    }
  }
  

  function handleError(errorMessage) {
    console.error(errorMessage);
    // alert(errorMessage);
  }
  let timeoutId;
  
  function triggerOverrideForSupportedWebsite() {
    console.log("window.location.origin", window.location.origin)
    if (isSupportedWebsite()) {
      console.log("website is supported, overriding")
      const currentUrl = window.location.origin;
      floatingToastNotification.innerText = 'Lighthouse is ready, awaiting your command.';
      switch (true) {
        case currentUrl.includes('slack.com'):
            console.log("adding slack coaching overrides")
          // Add code specific to slack.com
            overrideSlackTextInput();
            // TODO: refactor into helper callback function
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
        if (floatingToastNotification) {
            floatingToastNotification.style.display = 'block';
            floatingToastNotification.innerText = 'Lighthouse is plotting the course...'
        }
        if (slackInput) {
          slackInput.style.borderImage = 'radial-gradient(ellipse at var(--gradX) var(--gradY), var(--c1), var(--c1) 10%, var(--c2) 40%) 30';
          slackInput.style.animation = 'borderRadial var(--d) linear infinite forwards';
        }

        const { suggestions, thoughts } = await fetchGPT4MessageSuggestions(inputText);
        // const debouncedFetch = debounce(fetchGPT4Suggestions, 10000);
        // await debouncedFetch(inputText);
        console.log("suggestions", suggestions)
        // if (suggestions && suggestions.length > 0) {
          hideSuggestions();
        displaySuggestions(suggestions, thoughts);
        // }
      }

    } catch (error) {
      handleError('Failed to fetch suggestions from GPT-4 API: ' + error);
    }
  }, 3000)
    
            });
          break;
        case currentUrl.includes('mail.google.com'):
          // Add code specific to mail.google.com
          break;
        case currentUrl.includes('linkedin.com'):
          // Add code specific to linkedin.com
          break;
        case currentUrl.includes('meet.google.com'):
          // Add code specific to meet.google.com
          break;
        case currentUrl.includes('calendar.google.com'):
          // Add code specific to calendar.google.com
          break;
        default:
          console.log('Unsupported website');
      }
        
    } else {
      floatingToastNotification.innerText = 'Lighthouse is not active on this website.';
      setTimeout(() => {
        floatingToastNotification.style.display = 'none'
      }, 3000)
      floatingButton.style.border = '#acacac 2px dashed'; // converted to RGBA
    }
  }

  window.addEventListener('load', () => {
    setTimeout(() => {
        setupStyling()
      floatingWidgetButton();
      triggerOverrideForSupportedWebsite()
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
})();

export {}

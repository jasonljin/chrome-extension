// @ts-nocheck
import axios, { AxiosRequestConfig } from 'axios';
import $ from 'jquery';

const PROMPTLAYER_API_KEY = ""

async function promptLayer(tags, engine, functionName, prompt, messages, requestResponse, requestStartTime, requestEndTime) {
  if (!PROMPTLAYER_API_KEY) {
    console.error('promptLayer', 'no api key')
    return Promise.resolve();
  }
  
  if (prompt === null && messages === null) {
    console.error('promptLayer', 'no prompt or messages')
    return Promise.resolve();
  }

  var kwargs = {"engine": engine};
  if (messages !== null) {
    kwargs["messages"] = messages;
  } 
  if (prompt !== null) {
    kwargs["prompt"] = prompt;
  }

  try {
    const requestInput = {
      "function_name": functionName,
      "args": [],
      "kwargs": kwargs,
      "tags": tags,
      "request_response": requestResponse,
      "request_start_time": Math.floor(requestStartTime / 1000),
      "request_end_time": Math.floor(requestEndTime / 1000),
      "api_key": PROMPTLAYER_API_KEY,
    };
    const data = await fetch('https://api.promptlayer.com/track-request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(requestInput),
    })
  } catch (e) {
    console.error('promptLayer error', e);
  }
}

(async function() {
  // const axiosSrc = chrome.extension.getURL('/axios.min.js')
  // const axiosSrc = chrome.extension.getURL('/axios.min.js')
  // const axios = await import('axios');
  // const $ = await import('jquery');
  // let suggestions;
  let activeInput;
  let autocompleteSuggestions = [];
  // let suggestionContainer;
  let floatingUI;
  let floatingButton;
  let floatingToastNotification;
  const activeInputId = 'activeLighthouseTextInput';
  const suggestionContainerId = 'suggestionContainer';
  const suggestionListId = 'suggestionList';
  const floatingButtonId = 'floatingButton';

  let isOpen = false;
  let website = window.location.origin
  let websiteContext = mapSupportedWebsiteToEnum()

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
            --c3: rgba(0, 206, 88, 0.3);
            --c4: rgba(200, 200, 200, 0.5);
            --c5: rgba(50, 50, 206, 0.3);
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

  function loadFloatingActionButton() {
    floatingButton = document.createElement('button');
    const closeButton = document.createElement('button');
    floatingUI = document.createElement('div');
    floatingButton.id = floatingButtonId;
    floatingButton.style.width = '64px';
    floatingButton.style.height = '64px';
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
        let topic = encodeURIComponent(`better improving my performance, productivity and communication on the website: "${url}". Categorize the URL to a specific topic of productivity of performance reviews, collaboration, communication, composition, project management, 
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

  function loadFloatingToastWidget() {
    floatingToastNotification = document.createElement('div');
    floatingToastNotification.style.position = 'absolute';
    floatingToastNotification.style.left = '0';
    floatingToastNotification.style.bottom = '130px';
    floatingToastNotification.style.padding = '10px';
    floatingToastNotification.style.fontSize = "14px";
    floatingToastNotification.style.fontFamily = "Soehne Buch";
    floatingToastNotification.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    floatingToastNotification.style.border = '1px solid rgba(206, 0, 88, 0.3)';
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
  }

  function showToastNotification(toastMessage, duration=5000) {
    floatingToastNotification.style.transform = 'scaleX(1)';
    floatingToastNotification.style.left = '40px';
    floatingToastNotification.innerText = toastMessage;
    floatingToastNotification.style.display = 'block';
    setTimeout(() => {
        floatingToastNotification.style.display = 'none';
    }, duration);
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
      const responses = await fetchGPT4(prompt);
      return responses;
    };
    return await getContextAndFetchGPT4()
  }


  
  function isSupportedWebsite() {
    const supportedWebsites = [
      'workday.com',
      'slack.com',
      'mail.google.com',
      'linkedin.com',
      'meet.google.com',
      'calendar.google.com',
    ];
    
    return supportedWebsites.some(website => window.location.origin.includes(website));
  }
  function mapSupportedWebsiteToEnum() {
        const supportedWebsites = [
      'workday.com',
      'slack.com',
      'mail.google.com',
      'linkedin.com',
      'meet.google.com',
      'calendar.google.com',
    ];
    const supportedWebsiteLabels = {
      'slack.com': "Slack",
      'mail.google.com': "Gmail",
      'linkedin.com': "Linkedin",
      'meet.google.com': "Google Meet",
      'calendar.google.com': "Google Calendar",
      'workday.com': "Workday",
      'myworkday.com': "Workday"
    }

    if (isSupportedWebsite()) {
      const websiteLabel = supportedWebsites.find(website => window.location.origin.includes(website));
      return supportedWebsiteLabels[websiteLabel];
    }
    return window.location.origin
  }

  function overrideSlackTextInput() {

    let slackInputs = document.querySelectorAll('[data-qa="message_input"]') as HTMLElement[];

    let slackInput;

    console.log("slackInputs", slackInputs)
    if (slackInputs.length > 1) {
      slackInput = Array.from(slackInputs).find(input => input.classList.contains('focus')) || slackInputs[0];
    } else {
      slackInput = slackInputs[0];
    }
    if (slackInput) {
      if (activeInput) {
        activeInput.id = `${activeInputId}-unfocused`
        activeInput.style.border = 'rgba(255, 255, 255, 0.1) 2px solid'; // converted to RGBA
        activeInput.style.borderRadius = '4px';
      }
      slackInput.id = activeInputId;
      activeInput = slackInput;
      // show initial red border initialize animation on border
      // slackInput.style.zIndex = '999';
    }
    
    if (!slackInput) {
      handleError('Failed to override Slack text input box. Disabling extension.');
      return;
    }

    // slackInput.style.backgroundColor = '#fff';
    // slackInput.style.border = '1px solid #00f';

    // const floatingButton = document.createElement('textarea');
    slackInput.style.width = '100%';
    slackInput.style.height = '100%';
    // slackInput.style.padding = '8px';
    // slackInput.textContent = 'Copilot enabled... Start typing to get real-time coaching as you type.';
    // newInput.style.backgroundColor = '#fff';

    if (activeInput) {
      activeInput.style.border = 'rgba(255, 255, 255, 0.1) 2px solid'; // converted to RGBA
      activeInput.style.borderImage = 'radial-gradient(ellipse at var(--gradX) var(--gradY), var(--c4), var(--c4) 40%, var(--c5) 70%) 30';
      activeInput.style.animation = 'borderRadial var(--d) linear infinite forwards';
      setTimeout(() => {
        activeInput.style.border = 'rgba(255, 255, 255, 0.1) 2px solid'; // converted to RGBA
        activeInput.style.borderRadius = '4px';
      }, 2000)
    }

  }

  function overrideWorkdayTextInput() {
    let editableInputs = document.querySelectorAll('.cke_editable') as HTMLElement[];
    let inputsArray = Array.from(editableInputs);
    let focusedInput = inputsArray.find(input => {
      let currentElement = input;
      for (let i = 0; i < 3; i++) {
        if (!currentElement.parentElement) {
          return false;
        }
        currentElement = currentElement.parentElement;
      }
      return currentElement.classList.contains('cke_focus');
    });
    if (focusedInput) {
      focusedInput.id = activeInputId;
      activeInput = focusedInput;
      activeInput.style.border = 'rgba(255, 255, 255, 0.1) 2px solid';
      activeInput.style.borderImage = 'radial-gradient(ellipse at var(--gradX) var(--gradY), var(--c4), var(--c4) 40%, var(--c5) 70%) 30';
      activeInput.style.animation = 'borderRadial var(--d) linear infinite forwards';
      showToastNotification("Looking for support on a 360 review?")
      setTimeout(() => {
        activeInput.style.border = 'rgba(255, 255, 255, 0.1) 2px solid';
        activeInput.style.borderRadius = '4px';
      }, 2000)
    }
    
  }

  function overrideLinkedinNewPostTextInput() {
    let qlEditorInput = document.querySelector('.ql-editor') as HTMLElement;
    activeInput = qlEditorInput;
    if (!qlEditorInput) {
      handleError('Failed to override ql-editor text input box. Disabling extension.');
      return;
    }

    qlEditorInput.id = activeInputId;
    qlEditorInput.style.width = '100%';
    qlEditorInput.style.height = '100%';

    activeInput.style.border = 'rgba(255, 255, 255, 0.1) 2px solid';
    activeInput.style.borderImage = 'radial-gradient(ellipse at var(--gradX) var(--gradY), var(--c4), var(--c4) 40%, var(--c5) 70%) 30';
    activeInput.style.animation = 'borderRadial var(--d) linear infinite forwards';
    setTimeout(() => {
      activeInput.style.border = 'rgba(255, 255, 255, 0.1) 2px solid';
      activeInput.style.borderRadius = '4px';
    }, 2000)
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
    let completions = response.data.choices.map(choice => choice.text.split("Suggestion:").map(x => x.trim())).flat()
    return completions
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

    var requestStartTime = Date.now()
    
    console.log("sending req to openAPI", request)
    const response = await axios.post(url, body, headers);
    var requestEndTime = Date.now()
    promptLayer(['lighthouse-chrome-extension'], params.model, "openai.ChatCompletion.create", prompt, undefined, response.data, requestStartTime, requestEndTime);

    let thoughts = response.data.choices.map(choice => choice.message.content.split("Suggestion:").map(x => x.trim())).flat().filter(text => text.includes("Thought:"));
    let suggestions = response.data.choices.map(choice => choice.message.content.split("Suggestion:").map(x => x.trim())).flat().filter(text => !text.includes("Thought:"));
    return { suggestions, thoughts }
  }


  function fetchGPT4MessageSuggestions(inputText, scenario='Communication', websiteContext="Slack") {
    console.log("input text:", inputText)
    return new Promise(async (resolve, reject) => {
      try {
        const apiKey = await new Promise((resolve, reject) => {
          chrome.storage?.sync.get(['apiKey'], (result) => {
            if (chrome.runtime.lastError) {
              resolve("")
              // reject(chrome.runtime.lastError);
            } else {
              if (!result.apiKey) {
                resolve("")
                // if (window.confirm("No API key set! Please press OK to set your OpenAPI key in the extension settings.")) {
                //   {
                //     chrome.runtime.sendMessage("openOptionsPage");
                //     // reject(chrome.runtime.lastError);
                //     // window.location.href='chrome://extensions/?options=igekdceaeidlplodklgkdhkbbmmgeggf';
                //   };
                // }
              } else {
                resolve(result.apiKey);
              }
            }
          });
        });

        console.log("current scenario", scenario)
        function getElementsWithClass(parentClass, targetClass) {
          const parentElement = document.querySelector(parentClass);
          if (parentElement) {
            return Array.from(parentElement.getElementsByClassName(targetClass));
          }
          return [];
        }

        let audienceContext = '';
         function generatePrompt(scenario: string) {
            let prompt = '';

            switch (scenario) {
              case "Performance review": 
                  audienceContext = document.querySelector('[data-automation-id="pageHeader"]').innerText
                  prompt = `You're a performance feedback coach bot, designed to guide your client to provide more constructive, specific, and appropriate feedback on ${websiteContext}. 
                  Your client is on Workday 360. Help them give feedback to ${audienceContext.split("\n")[1]} in the following ways:
                   a) Come up with meaningful feedback, use helpful templates where relevant
                   b) Avoid being too positive (or too negative), guide them to center the feedback to be more balanced
                   c) Include specific examples, and avoid speaking in generalities
                   d) Identify and callout unconscious biases (such as recency bias, gender bias)
                    e) Identify inappropriate language (talk about socializing, personal things, 'mom duties' etc), and help them avoid such language

                  Only share feedback and templates. Never complete the rest of their response. Address your client directly.
                  Think through what the best recommendation you can provide and share those "thoughts" with the prefix "Thought:". Then provide the best recmmendation prefixed with "Suggestion:".
                  Below is the feedback that they're typing currently. Give your best recommendation for how to improve their performance review process:`;
                  break;
              case 'Communication':
                if (websiteContext == "Slack") {
                  function isInThreadsSidePanel() {
                    const activeTextInputParent = activeInput.closest('.p-threads_flexpane_container');
                    return !!activeTextInputParent;
                  }
                  
                  let audience;
                  let conversationContext;
                  if (isInThreadsSidePanel()) {
                    const sendersInThread = getElementsWithClass('.p-threads_flexpane_container', 'c-message__sender');
                    console.log("sendersInThread", sendersInThread)
                    audience = Array.from(new Set(sendersInThread.map(sender => sender.innerText))).join(', ');
                  } else {
                    audience = document.querySelector('[data-qa="channel_name"]').innerText;
                  }
                  audienceContext = `They are currently writing a message to ${audience}. Determine whether this is a channel, a group of people, or an individual, and tailor the message accordingly.`
                }
                prompt = `You're a communication coach bot, designed to help your client be more concise, persuasive, thoughtful, and inspiring, as they're messaging their teammates on ${websiteContext}. 
                  You're allowed to selectively use ${websiteContext}-friendly markdown, new paragraphs, and emojis, but only if it improves the message in being more concise, persuasive, thoughtful or impactful.
                  Think through what the best recommendation you can provide and share those "thoughts" with the prefix "Thought:". Then provide the new message prefixed with "Suggestion:".
                  ${audienceContext}
                  Below is the message that they're typing currently, give your best recommendation for how to make it more concise, thoughtful, persuasive, or inspiring:`;
                break;
              // Add more cases for different scenarios if needed
              case 'Laid-off':
              case 'Layoffs':
              case 'Laidoff':
              case 'Laid off':
                prompt = `You're a career coach bot, designed to support your client navigate life transitions and their general career. 
                  
                  Think through what the best question, recommendation, or support you can provide and share those "thoughts" with the prefix "Thought:". Then share suggestions. Your suggestions should be prefixed with "Suggestion:".
                  Below is the message that they're typing on ${websiteContext} currently. If they're currently experiencing a layoff, offer support, and advice for navigating a challenging time, and ask if they'd like to connect with a BetterUp coach. Otherwise, provide them general suggestions and coaching:`;
                break;
              case 'Promotion':
              case 'Promoted':
              case 'Hired':
              case 'Joining':
                prompt = `You're a career coach bot, designed to support your client navigate life transitions and their general career. 
                  
                  Think through what the best question, recommendation, or support you can provide and share those "thoughts" with the prefix "Thought:". Then provide it as a message prefixed with "Suggestion:".
                  Below is the message that they're typing on ${websiteContext} currently. If they're currently experiencing a promotion, or new role, offer specific support and advice for navigating that moment, and ask if they'd like to connect with a BetterUp coach. Otherwise, provide them general suggestions and coaching:`;
                break;
              // Add more cases for different scenarios if needed
              default:
                prompt = `You're a career coach bot, designed to support your client navigate life transitions and their general career. 
                  
                   Think through what the best question, recommendation, or support you can provide and share those "thoughts" with the prefix "Thought:". Then share suggestions. Your suggestions should be prefixed with "Suggestion:".
                  Below is the message that they're typing on ${websiteContext} currently. If they're currently experiencing a layoff, offer support, and advice for navigating a challenging time, and ask if they'd like to connect with a BetterUp coach. Otherwise, provide them general suggestions and coaching:`;
            }

            return prompt;
          }
          

        
        let prompt = generatePrompt(scenario)

        let params = {
          model: "gpt-3.5-turbo", 
          max_tokens: 400,
          n: 1,
          stop: null,
          temperature: 0.7,
        }

        let joinedPrompt = `${prompt}
        ${inputText}`

        console.log("joinedPrompt", joinedPrompt)

        let { suggestions, thoughts } = await fetchChatCompletions(joinedPrompt, params, apiKey)       
        console.log("suggestions & thoughts", suggestions, thoughts)
        resolve({ suggestions, thoughts });
      } catch (error) {
        console.log("error fetching suggestion", error)
        reject(error);
      }
    });
  }

  function displaySuggestions(suggestions, thoughts, suggestionsContainerHeadingText="", scenario="Communication") {
    console.log("displaying suggestions:", suggestions)
    let suggestionContainer = document.getElementById(suggestionContainerId);
    let suggestionList = document.getElementById(suggestionListId);
    if (!suggestionContainer) {
      suggestionContainer = document.createElement('div');
      suggestionContainer.id = suggestionContainerId;
      suggestionContainer.style.position = 'absolute';
      if (scenario == "Performance review") {
        suggestionContainer.style.right = "40px";
      } else {
        suggestionContainer.style.left = "40px";
      }
        suggestionContainer.style.bottom = "160px";
      suggestionContainer.style.zIndex = '10002';
    suggestionContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    suggestionContainer.style.color = '#ffffff';
    suggestionContainer.style.backdropFilter = 'blur(10px)';
    suggestionContainer.style.border = '2px solid rgba(206, 0, 88, 0.2)';
      suggestionContainer.style.borderRadius = '8px';
      suggestionContainer.style.padding = '0px';
      suggestionContainer.style.width = '500px';
      suggestionContainer.style.height = 'auto';
      suggestionContainer.style.display = 'block';

      floatingUI.appendChild(suggestionContainer);
    //   activeInputId.appendChild(suggestionContainer);
    }

    const closeButton = document.createElement('button');
    closeButton.innerText = 'x';
    closeButton.style.position = 'absolute';
    closeButton.style.top = '4px';
    closeButton.style.right = '8px';
    closeButton.style.backgroundColor = 'transparent';
    closeButton.style.border = 'none';
    closeButton.style.color = '#ffffff';
    closeButton.style.fontSize = '20px';
    closeButton.style.zIndex = '10002';
    closeButton.style.cursor = 'pointer';
    closeButton.addEventListener('click', () => {
      suggestionContainer.remove();
    });

    suggestionContainer.appendChild(closeButton);
 
    suggestionContainer.appendChild(closeButton);
    

    let suggestionsContainerHeading;
    suggestionsContainerHeading = document.createElement('div');
    suggestionsContainerHeading.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
    suggestionsContainerHeading.style.color = '#ffffff';
    suggestionsContainerHeading.style.backdropFilter = 'blur(10px)';
    suggestionsContainerHeading.style.padding = '12px';
    suggestionsContainerHeading.style.fontSize = '14px';
    suggestionsContainerHeading.style.fontFamily = "Soehne Buch";
    suggestionsContainerHeading.style.paddingTop = '16px';
    suggestionsContainerHeading.style.paddingBottom = '16px';
    suggestionsContainerHeading.textContent = suggestionsContainerHeadingText;
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
          subheading.style.fontSize = '14px';
          subheading.style.fontWeight = 'bold';
          subheading.style.fontFamily = "Soehne Buch";
          subheading.style.padding = '12px';
          subheading.style.borderRadius = '8px';
          subheading.style.backgroundColor = 'rgba(206, 0, 88, 0.2)';
          subheading.style.color = '#fff';
          const feedbackButtonDiv = document.createElement('div');
          const feedbackButton = document.createElement('button');
          feedbackButton.innerText = 'Give feedback for Lighthouse';
          feedbackButton.style.backgroundColor = 'rgba(255, 255, 255, 1)';
          feedbackButton.style.border = 'none';
          feedbackButton.style.color = '#000';
          feedbackButton.style.fontSize = '14px';
          feedbackButton.style.margin = '12px';
          feedbackButton.style.marginBottom = '16px';
          feedbackButton.style.padding = '8px 12px';
          feedbackButton.style.borderRadius = '4px';
          feedbackButton.style.cursor = 'pointer';

          
          feedbackButton.style.display = 'flex';
          feedbackButton.style.justifyContent = 'flex-end';
          feedbackButton.style.textAlign = 'right';
          feedbackButtonDiv.appendChild(feedbackButton);
          
          feedbackButton.addEventListener('click', () => {
            // Add your event handler for the feedback button here
            window.open('https://app.slack.com/client/T02BP494Z/C05D68C65LZ', '_blank');
          });

          suggestionContainer.appendChild(feedbackButtonDiv);
          // subheading.style.position = 'absolute';
          // subheading.style.marginBottom = '56px'
          suggestionContainer.appendChild(subheading);
      }
      const suggestionParagraph = document.createElement('p');
      suggestionParagraph.innerText = suggestion;
      suggestionParagraph.style.color = '#fff'
      suggestionParagraph.style.fontFamily = "Soehne Buch";
      suggestionParagraph.style.fontSize = '16px';
      listItem.appendChild(suggestionParagraph);
      listItem.style.position = 'relative';
      listItem.style.height = '100%';
      listItem.style.backgroundColor = 'rgba(255, 255, 255, 0.3)';
      listItem.style.boxShadow = 'rgba(255, 231, 125, 0.352) 0px 4px 10px 0px';
      
      listItem.style.border = '2px #E7E6E7';
      listItem.style.borderRadius = '8px';
      listItem.style.cursor = 'pointer';
      listItem.style.padding = '12px';
      listItem.style.paddingBottom = '48px';
      listItem.style.overflowY = 'scroll';

      const tabIcon = document.createElement('p');
      tabIcon.style.backgroundColor = 'rgba(30, 30, 30, 0.9)';
      tabIcon.style.padding = '8px';

      if (scenario == 'Communication' || scenario == 'Performance review') {
        tabIcon.textContent = '↹ Tab';
      } else {
        tabIcon.textContent = 'Go to resource';
      }
      tabIcon.style.fontFamily = 'Soehne Buch';
      tabIcon.style.fontSize = '10px';
      tabIcon.style.color = '#e6e6e6';
      tabIcon.style.borderRadius = '4px';
      tabIcon.style.position = 'absolute';
      tabIcon.style.bottom = '0px';
      tabIcon.style.right = '12px';
      tabIcon.style.zIndex = '10002';
      listItem.appendChild(tabIcon);
      
      listItem.addEventListener('click', () => {
        if (scenario == "Communication") {
          overrideTextInputWithSuggestion(suggestion)
        } else {
          window.open(`https://swordfish-next.vercel.app/embed?blogTitle=${scenario}`, "_blank")
        }
      });
 

      console.log("suggestionList", suggestionList)

      suggestionList.appendChild(listItem);
    });
    
  }

  function overrideTextInputWithSuggestion(suggestion) {
      let textEditors = document.querySelectorAll('.ql-editor') as Element[];

      if (!Array.isArray(textEditors)) {
        textEditors = Array.from(textEditors);
      }
      console.log("textEditors", textEditors)
      const activeTextEditor = textEditors.find(editor => {
        const parentElement = editor.parentElement;
        return (parentElement && parentElement.id == activeInputId) || editor.classList.contains("focus");
      }) || textEditors[0];

      console.log("activeTextEditor", activeTextEditor)
      const suggestionContainer = document.getElementById(suggestionContainerId);
      if (activeTextEditor) {
        let childParagraph = document.createElement('p');
        childParagraph.innerText = suggestion;
        activeTextEditor.replaceChildren(childParagraph);
        suggestionContainer.style.display = 'none';
        showToastNotification('Navigation complete! Good luck on your journey.')
        
      } else {
        showToastNotification("Something went wrong! Couldn't find where to send this message.")
      }
      if (activeInput) {
        // show green border animation
        activeInput.style.borderImage = 'radial-gradient(ellipse at var(--gradX) var(--gradY), var(--c3), var(--c2) 10%, var(--c3) 40%) 30';
        activeInput.style.animation = 'borderRadial var(--d) linear infinite forwards';
      }
      setTimeout(() => {
        activeInput.style.border = 'rgba(255, 255, 255, 0.1) 2px solid'; // converted to RGBA
        activeInput.style.borderRadius = '4px'; // converted to RGBA
      }, 2000)
  }

  function hideSuggestions() {
    autocompleteSuggestions = []
    const suggestionContainer = document.getElementById(suggestionContainerId);
    if (floatingToastNotification) {
        floatingToastNotification.style.display = 'none';
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



  const onTypeIntoActiveInput = async (event) => {
    clearTimeout(timeoutId);
    
    timeoutId = setTimeout(async () => {
        try {
          console.log("event value innerText", event.target.textContent)
        const inputText = event.target.textContent;
        console.log("inputText", inputText, inputText.length)

        let triggerKeywords = ["Promotion", "Layoffs", "Laid off", "New role", "Promoted"]
        function detectKeywords(inputText, keywords) {
          const detectedKeywords = [];
          keywords.forEach(keyword => {
            if (inputText.toLowerCase().includes(keyword.toLowerCase())) {
              detectedKeywords.push(keyword);
            }
          });
          return detectedKeywords;
        }
        
        let detectedKeywords = detectKeywords(inputText, triggerKeywords)

        if (inputText.length < 20) {
          floatingToastNotification.innerText = 'Lighthouse is awaiting course...';
          floatingToastNotification.style.display = 'block';
          if (inputText.trim() === '') {
            floatingToastNotification.style.display = 'none';
            activeInput.style.border = 'rgba(255, 255, 255, 0.1) 2px solid'; // converted to RGBA
            activeInput.style.borderRadius = '4px';
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
          hideSuggestions();
          showToastNotification('Lighthouse is plotting a course...')
          if (activeInput) {
            activeInput.style.borderImage = 'radial-gradient(ellipse at var(--gradX) var(--gradY), var(--c1), var(--c1) 10%, var(--c2) 40%) 30';
            activeInput.style.animation = 'borderRadial var(--d) linear infinite forwards';
          }

          let scenario = websiteContext == "Workday" ? "Performance review":detectedKeywords.length > 0 ? detectedKeywords[0]: "Communication"

          const { suggestions, thoughts } = await fetchGPT4MessageSuggestions(inputText, scenario, websiteContext);
          autocompleteSuggestions = suggestions

          let suggestionSubheading = `Showing relevant suggestions for ${websiteContext} ${scenario}`
          // const debouncedFetch = debounce(fetchGPT4Suggestions, 10000);
          // await debouncedFetch(inputText);
          // if (suggestions && suggestions.length > 0) {
          

          displaySuggestions(suggestions, thoughts, suggestionSubheading, scenario);
          // }
        }
    } catch (error) {
        handleError('Failed to fetch suggestions from GPT-4 API: ' + error);
      }
    }, 3000)
      
  }
  
  function triggerOverrideForSupportedWebsite() {
    console.log("window.location.origin", window.location.origin)
    if (isSupportedWebsite()) {
      console.log("website is supported, overriding")
      const currentUrl = window.location.origin;

      switch (true) {
        case currentUrl.includes('slack.com'):
            console.log("adding slack coaching overrides")
          // Add code specific to slack.com
            overrideSlackTextInput();
            floatingToastNotification.innerText = 'Lighthouse is ready, awaiting your command.';
            // TODO: refactor into helper callback function
             const slackObservers = new MutationObserver((mutations) => {
               mutations.forEach((mutation) => {
                if (mutation.addedNodes.length > 0) {
                  mutation.addedNodes.forEach((node) => {
                    if (node.classList && node.classList.contains('p-threads_flexpane_container')) {
                      overrideSlackTextInput();                
                      // $(document).on('input', `#${activeInputId}`, onTypeIntoActiveInput);      
                    }
                  })
                }
                if (mutation.attributeName === 'class') {
                  const targetNode = mutation.target as HTMLElement;
                  if (targetNode.getAttribute("data-qa") === 'message_input' && targetNode.classList.contains('focus')) {
                    overrideSlackTextInput();
                    // $(document).on('input', `#${activeInputId}`, onTypeIntoActiveInput);
                  }
                }
               
            });
          });
          slackObservers.observe(document.body, { attributes:true, childList: true, subtree: true });
            $(document).on('input', `#${activeInputId}`, onTypeIntoActiveInput);
            $(document).on('keydown', (event) => {
              if (event.key === 'Escape') {
                hideSuggestions();
              }
              if ((event.key === 'Tab' || event.keyCode == 9 || event.which == 9)) {
                event.preventDefault();
                if (autocompleteSuggestions.length > 0) {
                  overrideTextInputWithSuggestion(autocompleteSuggestions[0]);
                }
              }
            });
          break;
        case currentUrl.includes('mail.google.com'):
          // Add code specific to mail.google.com
          break;
        case currentUrl.includes('linkedin.com'):
          // Add code specific to linkedin.com

          // call overrideLinkedinNewPostTextInput when the Linkedin new post modal is added to the browser DOM, with the className share-box
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              if (mutation.addedNodes.length > 0) {
                mutation.addedNodes.forEach((node) => {
                  if (node.classList && node.classList.contains('share-box')) {
                    // alert("New post modal open!")
                    overrideLinkedinNewPostTextInput();
                    floatingToastNotification.innerText = 'Lighthouse is ready, awaiting your command.';
                    $(document).on('input', `#${activeInputId}`, onTypeIntoActiveInput);
                  }
                });
              }
            });
          });

          observer.observe(document.body, { childList: true, subtree: true });
          
          
          // overrideLinkedinNewPostTextInput();
          break;
        case currentUrl.includes('meet.google.com'):
          // Add code specific to meet.google.com
          break;
        case currentUrl.includes('calendar.google.com'):
          // Add code specific to calendar.google.com
          break;
        case currentUrl.includes('workday.com'):
          // Add code specific to workday.com
            overrideWorkdayTextInput();
            floatingToastNotification.innerText = 'Lighthouse is ready, awaiting your command.';
            // TODO: refactor into helper callback function
             const workdayObservers = new MutationObserver((mutations) => {
               mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class') {
                  const targetNode = mutation.target as HTMLElement;
                  if (targetNode.classList.contains('cke_focus')) {
                    overrideWorkdayTextInput();
                    // $(document).on('input', `#${activeInputId}`, onTypeIntoActiveInput);
                  }
                }
               
            });
          });
          workdayObservers.observe(document.body, { attributes:true, childList: true, subtree: true });
            $(document).on('input', `#${activeInputId}`, onTypeIntoActiveInput);
             $(document).on('keydown', (event) => {
              if (event.key === 'Escape') {
                if (autocompleteSuggestions.length > 0) {
                  event.preventDefault();
                  hideSuggestions();
                }
              }
              if ((event.key === 'Tab' || event.keyCode == 9 || event.which == 9)) {
                event.preventDefault();
                if (autocompleteSuggestions.length > 0) {
                  overrideTextInputWithSuggestion(autocompleteSuggestions[0]);
                }
              }
            });
          break;
        default:
          console.log('Unsupported website');
      }
        
    } else {
      showToastNotification('Lighthouse is not active on this website.', 3000)
      floatingButton.style.border = '#acacac 2px dashed'; // converted to RGBA
      floatingButton.style.opacity = '10%'
      floatingButton.style.zIndex = 1
    }
  }

  window.addEventListener('load', () => {
    let font = new FontFace("Soehne Buch", "url(https://raw.githubusercontent.com/jasonljin/slack-copilot/main/public/fonts/soehne-web-buch.woff2");
    document.fonts.add(font);
    setTimeout(() => {
      setupStyling()
      loadFloatingActionButton();
      loadFloatingToastWidget();
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

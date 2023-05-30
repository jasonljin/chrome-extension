(async function() {
  const axios = await import('axios');
  const $ = await import('jquery');

  const slackTextInputId = 'slackTextInput';
  const suggestionContainerId = 'suggestionContainer';
  const suggestionListId = 'suggestionList';

  function overrideSlackTextInput() {
    const slackInput = document.querySelector('[data-qa="message_input"]');
    if (!slackInput) {
      handleError('Failed to override Slack text input box. Disabling extension.');
      return;
    }

    const newInput = document.createElement('textarea');
    newInput.id = slackTextInputId;
    newInput.style.width = '100%';
    newInput.style.height = '100%';
    newInput.style.resize = 'none';

    slackInput.parentElement.replaceChild(newInput, slackInput);
  }

  function fetchGPT4Suggestions(inputText) {
    return new Promise(async (resolve, reject) => {
      try {
        const apiKey = await new Promise((resolve, reject) => {
          chrome.storage.sync.get(['apiKey'], (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result.apiKey);
            }
          });
        });

        const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
          prompt: inputText,
          max_tokens: 50,
          n: 3,
          stop: null,
          temperature: 0.7,
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
        });

        resolve(response.data.choices.map(choice => choice.text.trim()));
      } catch (error) {
        reject(error);
      }
    });
  }

  function displaySuggestions(suggestions) {
    let suggestionContainer = document.getElementById(suggestionContainerId);
    if (!suggestionContainer) {
      suggestionContainer = document.createElement('div');
      suggestionContainer.id = suggestionContainerId;
      suggestionContainer.style.position = 'absolute';
      suggestionContainer.style.zIndex = 1000;
      suggestionContainer.style.backgroundColor = 'white';
      suggestionContainer.style.border = '1px solid #ccc';
      suggestionContainer.style.borderRadius = '4px';
      suggestionContainer.style.padding = '10px';
      suggestionContainer.style.width = '300px';
      suggestionContainer.style.display = 'none';

      const suggestionList = document.createElement('ul');
      suggestionList.id = suggestionListId;
      suggestionList.style.listStyleType = 'none';
      suggestionList.style.padding = 0;
      suggestionList.style.margin = 0;

      suggestionContainer.appendChild(suggestionList);
      document.body.appendChild(suggestionContainer);
    }

    const suggestionList = document.getElementById(suggestionListId);
    suggestionList.innerHTML = '';

    suggestions.forEach(suggestion => {
      const listItem = document.createElement('li');
      listItem.textContent = suggestion;
      listItem.style.cursor = 'pointer';
      listItem.style.padding = '5px 0';
      listItem.addEventListener('click', () => {
        document.getElementById(slackTextInputId).value = suggestion;
        suggestionContainer.style.display = 'none';
      });

      suggestionList.appendChild(listItem);
    });

    suggestionContainer.style.display = 'block';
  }

  function handleError(errorMessage) {
    console.error(errorMessage);
    alert(errorMessage);
  }

  overrideSlackTextInput();

  $(document).on('input', `#${slackTextInputId}`, async (event) => {
    try {
      const inputText = event.target.value;
      if (inputText.trim() === '') {
        document.getElementById(suggestionContainerId).style.display = 'none';
        return;
      }

      const suggestions = await fetchGPT4Suggestions(inputText);
      displaySuggestions(suggestions);
    } catch (error) {
      handleError('Failed to fetch suggestions from GPT-4 API.');
    }
  });
})();
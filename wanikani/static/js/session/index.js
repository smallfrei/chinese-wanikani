import {SESSION_STATE} from './constants.js';
import {
  getKey,
  getRandomCharacter,
  getType,
  isUserCorrect,
  isWordComplete,
} from './helpers.js';
import {getCookie, getData} from '../util.js';


$(document).ready(function() {
  window.session = {};
  $('#session-character-submit').click(validate);
  $('#session-character-get-answer').click(displayAnswer);
  $('#session-character-get-new-character').click(loadRandomCharacter);
  $('#session-character-input').keypress(function(ev) {
    if (ev.currentTarget.value && ev.keyCode !== 13) {
      window.state = SESSION_STATE.answering;
    }
  })
  document.addEventListener('keyup', function (ev) {
    ev.preventDefault();
    if (event.keyCode === 13) { // enter
      switch(window.state) {
        case SESSION_STATE.received:
          document.getElementById('session-character-input').focus();
          break;
        case SESSION_STATE.answering:
          validate();
          break;
        case SESSION_STATE.answered:
          loadRandomCharacter();
          break;
      }
    }
  });

  getData('GET', 'current_level_characters_list')
    .then(result => result.json())
    .then(result => {
      window.characters = result;
      loadRandomCharacter();
    });
});

function loadRandomCharacter(ev) {
  if (ev && ev.currentTarget.className === 'disabled') {
    ev.stopPropagation();
  } else {
    window.character = getRandomCharacter(window.characters);
    window.type = getType();
    window.state = SESSION_STATE.received;
    const {session, type} = window;
    const character = window.character.character;
    $('#session-character-displayed').text(() => character);
    $('#session-character-type').text(() => `${type}:`);
    if (!session[character]) {
      session[character] = {'incorrect': false};
    }
    clearFields();
  }
  return false;
}

function validate() {
  if (window.state === SESSION_STATE.received) {
    return false;
  }
  const {character, session, type} = window;
  const userInput = $('#session-character-input').val();
  const isCorrect = isUserCorrect(userInput, type, character);
  const results = isCorrect ? `you're right!` : `you're not right`;
  window.state = SESSION_STATE.answered;

  const character_string = character.character;
  session[character_string][type] = isCorrect;
  if (!isCorrect) {
    session[character_string]['incorrect'] = true;
  }
  const isComplete = isWordComplete(session[character_string]);
  const areBothCorrect = !!(isComplete && !session[character_string]['incorrect']);

  $('#session-character-results').text(() => results);
  $('#session-character-submit').addClass('disabled');
  $('#session-character-get-answer').removeClass('disabled');
  $('#session-character-get-new-character').removeClass('disabled');

  $.post('post_updated_character', {
    both_correct: areBothCorrect,
    character: character_string,
    is_complete: isComplete,
    is_correct: isCorrect,
    type: getKey(type),
    'csrfmiddlewaretoken': getCookie('csrftoken'),
  });
  return false;
}

function displayAnswer(ev) {
  if (ev.currentTarget.className === 'disabled') {
    ev.stopPropagation();
  } else {
    const {character, type} = window;
    const key = getKey(type);
    $('#session-character-answer').text(() => character[key]);
  }
  return false;
}

function clearFields() {
  $('#session-character-answer').text(() => '');
  $('#session-character').text(() => '');
  $('#session-character-results').text(() => '');
  $('#session-character-get-answer').addClass('disabled');
  $('#session-character-get-new-character').addClass('disabled');
  $('#session-character-submit').removeClass('disabled');
  if (document.getElementById('session-character-input')) {
    document.getElementById('session-character-input').value = '';
  }
}

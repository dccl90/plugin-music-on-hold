import { FlexPlugin } from 'flex-plugin';

const PLUGIN_NAME = 'MusicOnHoldPlugin';

export default class MusicOnHoldPlugin extends FlexPlugin {
  constructor() {
    super(PLUGIN_NAME);
  }

  /**
   * This code is run when your plugin is being started
   * Use this to modify any UI components or attach to the actions framework
   *
   * @param flex { typeof import('@twilio/flex-ui') }
   * @param manager { import('@twilio/flex-ui').Manager }
   */
  init(flex, manager) {
    const runtimeDomain = 'YOUR_RUNTIME_DOMAIN'

    //Replace HoldCall Action
    flex.Actions.replaceAction('HoldCall', (payload, original) => {
      return new Promise((resolve, reject) => {
        payload.holdMusicUrl = 'https://api.twilio.com/cowbell.mp3';
        const task = payload.task;
        const hold = true; 
        if(task.attributes.direction === 'outbound') {
          original(payload);
        } else {
          const conference = task.attributes.conference.sid;
          const participant = task.attributes.conference.participants.customer;
          toggleHold(conference, participant, hold, original, payload);
        }
        resolve();
      });
    });

    //Replace UnHoldCall Action
    flex.Actions.replaceAction('UnholdCall', (payload, original) => {
      return new Promise((resolve, reject) => {
        const task = payload.task;
        const hold = false;
        if(task.attributes.direction === 'outbound') {
            original(payload);
          } else {
            const conference = task.attributes.conference.sid;
            const participant = task.attributes.conference.participants.customer;
            toggleHold(conference, participant, hold, original, payload);
          }
          resolve();
      });
    });

    //Fetch Hold-Call function
    const toggleHold = function (conference, participant, hold, original, payload) {
      const jweToken = manager.store.getState().flex.session.ssoTokenPayload.token
      return fetch(`https://${runtimeDomain}/hold-call`, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        method: 'POST',
        body: `conference=${conference}&participant=${participant}&hold=${true}&holdMusicUrl=${payload.holdMusicUrl}&Token=${jweToken}`
      })
      .then(response => {
        original(payload);
      })
      .catch(error => {
        console.log(error);
      });
    };
  }
}

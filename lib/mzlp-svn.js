'use babel';

import MzlpSvnView from './mzlp-svn-view';
import { CompositeDisposable } from 'atom';

export default {

  mzlpSvnView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.mzlpSvnView = new MzlpSvnView(state.mzlpSvnViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.mzlpSvnView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'mzlp-svn:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.mzlpSvnView.destroy();
  },

  serialize() {
    return {
      mzlpSvnViewState: this.mzlpSvnView.serialize()
    };
  },

  toggle() {
    console.log('MzlpSvn was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};

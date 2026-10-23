const esc = s => String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createCloudUI({ cloud, joinToken, legacy, message, me, names }) {
  let key = '', busy = false;
  const panel = document.getElementById('syncPanel');
  const $ = id => document.getElementById(id);
  async function run(action) {
    if (busy) return; busy = true;
    const buttons=[...panel.querySelectorAll('button')];buttons.forEach(b=>b.disabled=true);
    try { await action(); }
    catch(error) { cloud.error=error.message; render(); message(error.message); }
    finally { busy=false;buttons.forEach(b=>b.disabled=false); }
  }
  function render() {
    const view=cloud.connected ? cloud.view : null;
    const invite=cloud.state.inviteExpires>Date.now()?cloud.state.invite:'';
    const next=JSON.stringify([cloud.configured,Boolean(view),view?.members.length,view?.room.names,invite,cloud.state.recovery]);
    if(key!==next) {
      key=next;
      if(!cloud.configured) {
        panel.innerHTML='<h4>Handys verbinden</h4><p class="status">Der Online-Abgleich wird gerade eingerichtet.</p>';
      } else if(view) {
        const other=view.me.slot==='a'?'b':'a';
        panel.innerHTML=`<h4>Gemeinsam verbunden</h4><p class="status">Du bist ${esc(names()[view.me.slot])}. Bewertungen, Gerichte, Fotos und die Ausschlussliste werden automatisch abgeglichen.</p>
          <p id="syncState" class="status" role="status" aria-live="polite"></p><p id="syncError" role="alert" hidden></p>
          <button class="btn ghost" id="syncRetry" type="button">Abgleich erneut versuchen</button>
          ${view.members.length<2?`<p class="status">Lade ${esc(names()[other])} ein. Der Link gilt 24 Stunden und kann einmal verwendet werden.</p><button class="btn" id="makeInvite" type="button">Einladungslink erstellen</button>${invite?`<label for="inviteLink">Privater Einladungslink<input type="text" id="inviteLink" readonly value="${esc(invite)}"></label><button class="btn ghost" id="copyInvite" type="button">Einladungslink kopieren</button>`:''}`:'<p class="status">Beide Plätze sind verbunden.</p>'}
          <details><summary>Gerätewechsel und Wiederherstellung</summary><p class="status">Bewahre deinen persönlichen Code sicher auf. Damit kannst du deinen Platz auf einem neuen Handy übernehmen. Das bisherige Gerät verliert dabei den Zugriff. Teile den Code nicht mit anderen.</p><button class="btn ghost" id="makeRecovery" type="button">Wiederherstellungscode anzeigen</button><label id="recoveryLabel" for="recoveryCode" hidden>Dein persönlicher Code<textarea id="recoveryCode" readonly></textarea></label></details>`;
        $('syncRetry').onclick=()=>run(()=>cloud.retry());
        if($('makeInvite'))$('makeInvite').onclick=()=>run(()=>cloud.invite());
        if($('copyInvite'))$('copyInvite').onclick=async()=>{
          try{await navigator.clipboard.writeText($('inviteLink').value);message('Einladungslink kopiert');}
          catch{ $('inviteLink').focus();$('inviteLink').select();message('Link markiert, jetzt kopieren'); }
        };
        $('makeRecovery').onclick=()=>run(async()=>{
          const code=cloud.state.recovery?'TM-R-'+cloud.state.recovery:await cloud.recovery();
          $('recoveryLabel').hidden=false;$('recoveryCode').value=code;$('recoveryCode').focus();$('recoveryCode').select();
        });
      } else {
        panel.innerHTML=`<h4>Handys verbinden</h4><p class="status">Ein Handy erstellt euren privaten Bereich. Die andere Person öffnet danach den Einladungslink auf ihrem Handy.</p>
          <p id="syncState" class="status" role="status" aria-live="polite"></p><p id="syncError" role="alert" hidden></p>
          ${joinToken?'<button class="btn" id="joinRoom" type="button">Einladung annehmen</button>':'<button class="btn" id="createRoom" type="button">Gemeinsamen Bereich erstellen</button>'}
          <details><summary>Vorhandenen Platz wiederherstellen</summary><label for="restoreCode">Dein persönlicher Wiederherstellungscode<textarea id="restoreCode" placeholder="TM-R-…" autocomplete="off" spellcheck="false"></textarea></label><button class="btn ghost" id="restoreRoom" type="button">Auf diesem Gerät wiederherstellen</button></details>`;
        if($('createRoom'))$('createRoom').onclick=()=>run(()=>{
          if(!me())throw new Error('Bitte zuerst Daniel oder Stina auswählen.');
          return cloud.create(me(),legacy());
        });
        if($('joinRoom'))$('joinRoom').onclick=()=>run(()=>cloud.join(joinToken,legacy()));
        $('restoreRoom').onclick=()=>run(()=>cloud.restore($('restoreCode').value));
      }
    }
    const status=cloud.status+(cloud.state.queue.length?` · ${cloud.state.queue.length} Änderung(en) vorgemerkt`:'');
    if($('syncState')&&$('syncState').textContent!==status)$('syncState').textContent=status;
    if($('syncError')){ $('syncError').textContent=cloud.error;$('syncError').hidden=!cloud.error; }
  }
  return {render};
}

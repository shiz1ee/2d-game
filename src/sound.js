let ac = null;

export const beep = (freq, ms, type = "square", vol = 0.08) => {
    ac = ac || new AudioContext();
    if (ac.state === "suspended") ac.resume();
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + ms / 1000);
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + ms / 1000);
};
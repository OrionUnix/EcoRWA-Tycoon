import { useState, useEffect, useRef } from 'react';

const TRACKS = [
    '/assets/sounds/music/ambient/music_A.mp3',
    '/assets/sounds/music/ambient/music_B.mp3',
    '/assets/sounds/music/ambient/music_C.mp3',
    '/assets/sounds/music/ambient/music_D.mp3',
    '/assets/sounds/music/ambient/music_E.mp3'
];

export function useGameMusic() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolumeState] = useState(0.5);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Initialisation
    useEffect(() => {
        const audio = new Audio(TRACKS[currentTrackIndex]);
        audio.volume = volume;
        audioRef.current = audio;

        const handleEnded = () => {
            nextTrack();
        };
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.pause();
            audio.src = '';
            audioRef.current = null;
        };
        // Disable exhaustive-deps because we only want to mount this once
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Gérer Play/Pause et Changement de piste
    useEffect(() => {
        if (!audioRef.current) return;

        if (!audioRef.current.src.endsWith(TRACKS[currentTrackIndex])) {
            const wasPlaying = !audioRef.current.paused || isPlaying;
            audioRef.current.src = TRACKS[currentTrackIndex];
            audioRef.current.load();
            if (wasPlaying) {
                audioRef.current.play().catch(e => console.warn("Audio play blocked (autoplaying next track):", e));
            }
        } else {
            if (isPlaying && audioRef.current.paused) {
                audioRef.current.play().catch(e => {
                    console.warn("Audio play blocked (user gesture required):", e);
                    setIsPlaying(false);
                });
            } else if (!isPlaying && !audioRef.current.paused) {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, currentTrackIndex]);

    // Gérer Volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const togglePlay = () => setIsPlaying(prev => !prev);

    const nextTrack = () => {
        setCurrentTrackIndex(prev => (prev + 1) % TRACKS.length);
        setIsPlaying(true);
    };

    const setVolume = (val: number) => {
        setVolumeState(Math.max(0, Math.min(1, val)));
    };

    return {
        isPlaying,
        volume,
        currentTrackIndex,
        togglePlay,
        nextTrack,
        setVolume
    };
}

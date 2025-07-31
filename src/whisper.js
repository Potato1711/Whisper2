import { pipeline } from '@xenova/transformers';

class WhisperProcessor {
    constructor() {
        this.transcriber = null;
        this.isLoading = false;
        this.isProcessing = false;
    }

    async initialize(onProgress = null) {
        if (this.transcriber || this.isLoading) return;
        
        this.isLoading = true;
        
        try {
            // Initialize the Whisper model
            this.transcriber = await pipeline(
                'automatic-speech-recognition',
                'Xenova/whisper-tiny.en',
                {
                    progress_callback: onProgress
                }
            );
            
            console.log('Whisper model loaded successfully');
        } catch (error) {
            console.error('Failed to load Whisper model:', error);
            throw error;
        } finally {
            this.isLoading = false;
        }
    }

    async extractAudioFromVideo(videoFile, onProgress = null) {
        return new Promise((resolve, reject) => {
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            video.onloadedmetadata = () => {
                // Create audio context
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const source = audioContext.createMediaElementSource(video);
                const destination = audioContext.createMediaStreamDestination();
                
                source.connect(destination);
                
                // Record audio
                const mediaRecorder = new MediaRecorder(destination.stream);
                const chunks = [];
                
                mediaRecorder.ondataavailable = (event) => {
                    chunks.push(event.data);
                };
                
                mediaRecorder.onstop = async () => {
                    const audioBlob = new Blob(chunks, { type: 'audio/wav' });
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    
                    // Convert to the format expected by Whisper
                    const audioData = audioBuffer.getChannelData(0);
                    resolve(audioData);
                };
                
                mediaRecorder.start();
                video.play();
                
                video.onended = () => {
                    mediaRecorder.stop();
                    audioContext.close();
                };
            };
            
            video.onerror = reject;
            video.src = URL.createObjectURL(videoFile);
        });
    }

    async transcribeAudio(audioData, onProgress = null) {
        if (!this.transcriber) {
            throw new Error('Whisper model not initialized');
        }

        this.isProcessing = true;
        
        try {
            const result = await this.transcriber(audioData, {
                return_timestamps: true,
                chunk_length_s: 30,
                stride_length_s: 5,
            });

            // Convert Whisper output to subtitle format
            const subtitles = this.convertToSubtitles(result);
            return subtitles;
        } catch (error) {
            console.error('Transcription failed:', error);
            throw error;
        } finally {
            this.isProcessing = false;
        }
    }

    convertToSubtitles(whisperResult) {
        const subtitles = [];
        
        if (whisperResult.chunks) {
            whisperResult.chunks.forEach((chunk, index) => {
                subtitles.push({
                    startTime: chunk.timestamp[0] || 0,
                    endTime: chunk.timestamp[1] || chunk.timestamp[0] + 3,
                    text: chunk.text.trim()
                });
            });
        } else {
            // Fallback for simple text output
            const text = whisperResult.text || whisperResult;
            const words = text.split(' ');
            const wordsPerSubtitle = 8;
            const avgDuration = 3; // seconds per subtitle
            
            for (let i = 0; i < words.length; i += wordsPerSubtitle) {
                const subtitleWords = words.slice(i, i + wordsPerSubtitle);
                const startTime = (i / wordsPerSubtitle) * avgDuration;
                const endTime = startTime + avgDuration;
                
                subtitles.push({
                    startTime,
                    endTime,
                    text: subtitleWords.join(' ')
                });
            }
        }
        
        return subtitles;
    }

    async processVideo(videoFile, onProgress = null) {
        try {
            // Initialize Whisper if not already done
            if (!this.transcriber) {
                await this.initialize(onProgress);
            }

            // Extract audio from video
            onProgress?.({ stage: 'extracting', progress: 0.1 });
            const audioData = await this.extractAudioFromVideo(videoFile, onProgress);
            
            // Transcribe audio
            onProgress?.({ stage: 'transcribing', progress: 0.5 });
            const subtitles = await this.transcribeAudio(audioData, onProgress);
            
            onProgress?.({ stage: 'complete', progress: 1.0 });
            return subtitles;
            
        } catch (error) {
            console.error('Video processing failed:', error);
            throw error;
        }
    }
}

export default WhisperProcessor;
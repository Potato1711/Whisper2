class VideoSubtitleGenerator {
    constructor() {
        this.subtitles = [];
        this.currentEditingIndex = -1;
        this.videoFile = null;
        this.videoDuration = 0;
        
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.videoInput = document.getElementById('videoInput');
        this.videoInfo = document.getElementById('videoInfo');
        this.videoName = document.getElementById('videoName');
        this.videoDuration = document.getElementById('videoDuration');
        
        // Video player
        this.videoPlayerSection = document.getElementById('videoPlayerSection');
        this.videoPlayer = document.getElementById('videoPlayer');
        
        // Subtitle editor
        this.subtitleEditorSection = document.getElementById('subtitleEditorSection');
        this.addSubtitleBtn = document.getElementById('addSubtitleBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.exportSrtBtn = document.getElementById('exportSrtBtn');
        this.subtitleList = document.getElementById('subtitleList');
        
        // Modal elements
        this.subtitleModal = document.getElementById('subtitleModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.modalClose = document.getElementById('modalClose');
        this.startTime = document.getElementById('startTime');
        this.endTime = document.getElementById('endTime');
        this.subtitleText = document.getElementById('subtitleText');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.saveSubtitleBtn = document.getElementById('saveSubtitleBtn');
        
        // Notification
        this.notification = document.getElementById('notification');
    }

    bindEvents() {
        // Upload area events
        this.uploadArea.addEventListener('click', () => this.videoInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        this.videoInput.addEventListener('change', this.handleFileSelect.bind(this));
        
        // Video player events
        this.videoPlayer.addEventListener('loadedmetadata', this.handleVideoLoaded.bind(this));
        this.videoPlayer.addEventListener('timeupdate', this.handleTimeUpdate.bind(this));
        
        // Button events
        this.addSubtitleBtn.addEventListener('click', () => this.openModal());
        this.clearAllBtn.addEventListener('click', () => this.clearAllSubtitles());
        this.exportSrtBtn.addEventListener('click', () => this.exportSRT());
        
        // Modal events
        this.modalClose.addEventListener('click', () => this.closeModal());
        this.cancelBtn.addEventListener('click', () => this.closeModal());
        this.saveSubtitleBtn.addEventListener('click', () => this.saveSubtitle());
        
        // Close modal when clicking outside
        this.subtitleModal.addEventListener('click', (e) => {
            if (e.target === this.subtitleModal) {
                this.closeModal();
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.subtitleModal.classList.contains('show')) {
                this.closeModal();
            }
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 'n':
                        e.preventDefault();
                        this.openModal();
                        break;
                    case 's':
                        e.preventDefault();
                        this.exportSRT();
                        break;
                }
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processVideoFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processVideoFile(file);
        }
    }

    processVideoFile(file) {
        // Validate file type
        if (!file.type.startsWith('video/')) {
            this.showNotification('Please select a valid video file', 'error');
            return;
        }

        this.videoFile = file;
        this.videoName.textContent = file.name;
        
        // Create object URL for video
        const videoURL = URL.createObjectURL(file);
        this.videoPlayer.src = videoURL;
        
        // Show video info and player
        this.videoInfo.style.display = 'block';
        this.videoPlayerSection.style.display = 'block';
        this.subtitleEditorSection.style.display = 'block';
        
        this.showNotification('Video loaded successfully!');
    }

    handleVideoLoaded() {
        const duration = this.videoPlayer.duration;
        this.videoDuration = duration;
        
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        document.getElementById('videoDuration').textContent = 
            `Duration: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    handleTimeUpdate() {
        // This could be used for real-time subtitle display in the future
        const currentTime = this.videoPlayer.currentTime;
        // Find and highlight current subtitle if needed
    }

    openModal(editIndex = -1) {
        this.currentEditingIndex = editIndex;
        
        if (editIndex >= 0) {
            // Editing existing subtitle
            const subtitle = this.subtitles[editIndex];
            this.modalTitle.textContent = 'Edit Subtitle';
            this.startTime.value = subtitle.startTime;
            this.endTime.value = subtitle.endTime;
            this.subtitleText.value = subtitle.text;
        } else {
            // Adding new subtitle
            this.modalTitle.textContent = 'Add Subtitle';
            this.startTime.value = '';
            this.endTime.value = '';
            this.subtitleText.value = '';
            
            // Set default times based on current video time
            if (this.videoPlayer.currentTime) {
                this.startTime.value = this.videoPlayer.currentTime.toFixed(1);
                this.endTime.value = (this.videoPlayer.currentTime + 5).toFixed(1);
            }
        }
        
        this.subtitleModal.classList.add('show');
        this.startTime.focus();
    }

    closeModal() {
        this.subtitleModal.classList.remove('show');
        this.currentEditingIndex = -1;
    }

    saveSubtitle() {
        const startTime = parseFloat(this.startTime.value);
        const endTime = parseFloat(this.endTime.value);
        const text = this.subtitleText.value.trim();
        
        // Validation
        if (isNaN(startTime) || isNaN(endTime)) {
            this.showNotification('Please enter valid start and end times', 'error');
            return;
        }
        
        if (startTime >= endTime) {
            this.showNotification('End time must be greater than start time', 'error');
            return;
        }
        
        if (!text) {
            this.showNotification('Please enter subtitle text', 'error');
            return;
        }
        
        if (this.videoDuration && endTime > this.videoDuration) {
            this.showNotification('End time cannot exceed video duration', 'error');
            return;
        }
        
        const subtitle = { startTime, endTime, text };
        
        if (this.currentEditingIndex >= 0) {
            // Update existing subtitle
            this.subtitles[this.currentEditingIndex] = subtitle;
            this.showNotification('Subtitle updated successfully!');
        } else {
            // Add new subtitle
            this.subtitles.push(subtitle);
            this.showNotification('Subtitle added successfully!');
        }
        
        // Sort subtitles by start time
        this.subtitles.sort((a, b) => a.startTime - b.startTime);
        
        this.renderSubtitles();
        this.closeModal();
    }

    renderSubtitles() {
        if (this.subtitles.length === 0) {
            this.subtitleList.innerHTML = `
                <div class="subtitle-placeholder">
                    <p>No subtitles added yet. Click "Add Subtitle" to get started.</p>
                </div>
            `;
            return;
        }
        
        this.subtitleList.innerHTML = this.subtitles.map((subtitle, index) => `
            <div class="subtitle-item">
                <div class="subtitle-header">
                    <span class="subtitle-time">
                        ${this.formatTime(subtitle.startTime)} → ${this.formatTime(subtitle.endTime)}
                    </span>
                    <div class="subtitle-actions">
                        <button class="edit-btn" onclick="app.openModal(${index})">Edit</button>
                        <button class="delete-btn" onclick="app.deleteSubtitle(${index})">Delete</button>
                        <button onclick="app.seekToSubtitle(${index})">Go to</button>
                    </div>
                </div>
                <div class="subtitle-text">${this.escapeHtml(subtitle.text)}</div>
            </div>
        `).join('');
    }

    deleteSubtitle(index) {
        if (confirm('Are you sure you want to delete this subtitle?')) {
            this.subtitles.splice(index, 1);
            this.renderSubtitles();
            this.showNotification('Subtitle deleted');
        }
    }

    seekToSubtitle(index) {
        const subtitle = this.subtitles[index];
        this.videoPlayer.currentTime = subtitle.startTime;
        this.videoPlayer.play();
    }

    clearAllSubtitles() {
        if (this.subtitles.length === 0) {
            this.showNotification('No subtitles to clear', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to delete all subtitles? This action cannot be undone.')) {
            this.subtitles = [];
            this.renderSubtitles();
            this.showNotification('All subtitles cleared');
        }
    }

    exportSRT() {
        if (this.subtitles.length === 0) {
            this.showNotification('No subtitles to export', 'error');
            return;
        }
        
        let srtContent = '';
        
        this.subtitles.forEach((subtitle, index) => {
            const startTime = this.formatSRTTime(subtitle.startTime);
            const endTime = this.formatSRTTime(subtitle.endTime);
            
            srtContent += `${index + 1}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            srtContent += `${subtitle.text}\n\n`;
        });
        
        // Create and download file
        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        
        const fileName = this.videoFile ? 
            this.videoFile.name.replace(/\.[^/.]+$/, '') + '.srt' : 
            'subtitles.srt';
        
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(`SRT file exported: ${fileName}`);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = (seconds % 60).toFixed(1);
        return `${mins}:${secs.padStart(4, '0')}`;
    }

    formatSRTTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const milliseconds = Math.floor((seconds % 1) * 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message, type = 'success') {
        this.notification.textContent = message;
        this.notification.className = `notification ${type}`;
        this.notification.classList.add('show');
        
        setTimeout(() => {
            this.notification.classList.remove('show');
        }, 3000);
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VideoSubtitleGenerator();
});

// Add some helpful tips for users
document.addEventListener('DOMContentLoaded', () => {
    // Add keyboard shortcuts info
    const shortcutsInfo = document.createElement('div');
    shortcutsInfo.innerHTML = `
        <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 1rem; margin: 1rem 0; color: #1e40af; font-size: 0.875rem;">
            <strong>Keyboard Shortcuts:</strong><br>
            • Ctrl/Cmd + N: Add new subtitle<br>
            • Ctrl/Cmd + S: Export SRT file<br>
            • Escape: Close modal
        </div>
    `;
    document.querySelector('.features-section').after(shortcutsInfo);
});
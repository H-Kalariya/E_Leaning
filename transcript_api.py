# /// script
# requires-python = ">=3.12"
# dependencies = [
#     "click",
#     "youtube_transcript_api",
#     "flask",
#     "flask-cors",
#     "pydub",
#     "speechrecognition",
#     "python-dotenv",
# ]
# ///

import re
import sys
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Fix for OpenMP duplicate runtime error
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"

# Add FFmpeg to PATH for this session (Winget install location)
ffmpeg_path = os.path.join(os.environ['LOCALAPPDATA'], r"Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin")
if os.path.exists(ffmpeg_path):
    os.environ["PATH"] += os.pathsep + ffmpeg_path

import io
from typing import Optional
import click
from flask import Flask, request, jsonify
from flask_cors import CORS
from youtube_transcript_api import YouTubeTranscriptApi, TranscriptsDisabled, NoTranscriptFound
import whisper
import tempfile
from werkzeug.utils import secure_filename
import speech_recognition as sr
from pydub import AudioSegment
from groq import Groq

app = Flask(__name__)
CORS(app)

# Configure upload settings
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size
ALLOWED_EXTENSIONS = {'mp3', 'wav', 'm4a', 'flac', 'ogg', 'aac', 'wma', 'webm'}

# Groq Client - Load API key from environment variable
groq_api_key = os.getenv('GROQ_API_KEY')
if not groq_api_key:
    print("WARNING: GROQ_API_KEY not found in environment variables. Summarization will not work.")
    print("Please add your Groq API key to the .env file")
groq_client = Groq(api_key=groq_api_key) if groq_api_key else None

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def transcribe_audio_file(audio_file_path):
    """Transcribe audio file using Whisper."""
    try:
        print(f"Loading Whisper model...")
        model = whisper.load_model("base")  # Use base model for faster processing
        
        print(f"Transcribing audio file: {audio_file_path}")
        print(f"File exists: {os.path.exists(audio_file_path)}")
        print(f"File size: {os.path.getsize(audio_file_path)} bytes")
        
        # Check if file exists and is readable
        if not os.path.exists(audio_file_path):
            print(f"Error: Audio file does not exist: {audio_file_path}")
            return None
        
        # Check if file is empty
        if os.path.getsize(audio_file_path) == 0:
            print(f"Error: Audio file is empty")
            return None
            
        # Transcribe with verbose output to debug
        result = model.transcribe(
            audio_file_path,
            language='en',
            verbose=True,
            fp16=False  # Disable fp16 for better compatibility
        )
        
        print(f"Whisper result keys: {result.keys()}")
        print(f"Number of segments: {len(result.get('segments', []))}")
        print(f"Detected language: {result.get('language', 'unknown')}")
        print(f"Full text length: {len(result.get('text', ''))}")
        
        # Convert Whisper format to our standard format
        transcript_data = []
        for segment in result.get('segments', []):
            transcript_data.append({
                'text': segment['text'].strip(),
                'start': segment['start'],
                'duration': segment['end'] - segment['start']
            })
        
        # If no segments but we have text, create a single segment
        if not transcript_data and result.get('text', '').strip():
            print("No segments found, but text exists. Creating single segment.")
            transcript_data.append({
                'text': result['text'].strip(),
                'start': 0.0,
                'duration': 0.0
            })
        
        print(f"Successfully transcribed {len(transcript_data)} segments")
        return transcript_data
        
    except Exception as e:
        print(f"Error transcribing audio: {e}")
        print(f"Error type: {type(e)}")
        print(f"Error details: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

# -------------------------------------------------
# Google Speech Recognition (Alternative to Whisper)
# -------------------------------------------------
def prepare_voice_file(path: str) -> str:
    """
    Converts input audio file to WAV format if necessary and returns the path to the WAV file.
    """
    if os.path.splitext(path)[1] == '.wav':
        return path
    elif os.path.splitext(path)[1] in ('.mp3', '.m4a', '.ogg', '.flac'):
        audio_file = AudioSegment.from_file(
            path, format=os.path.splitext(path)[1][1:])
        wav_file = os.path.splitext(path)[0] + '.wav'
        audio_file.export(wav_file, format='wav')
        return wav_file
    else:
        raise ValueError(
            f'Unsupported audio format: {os.path.splitext(path)[1]}')


def transcribe_with_google_speech(audio_data, language='en-US') -> str:
    """
    Transcribes audio data to text using Google's speech recognition API.
    """
    r = sr.Recognizer()
    try:
        text = r.recognize_google(audio_data, language=language)
        return text
    except sr.UnknownValueError:
        return "Google Speech Recognition could not understand audio"
    except sr.RequestError:
        return "Could not request results from Google Speech Recognition service"
    except Exception as e:
        return f"Speech recognition error: {str(e)}"


def write_transcription_to_file(text, output_file) -> None:
    """
    Writes the transcribed text to the output file.
    """
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(text)


def speech_to_text(input_path: str, output_path: str, language: str = 'en-US') -> None:
    """
    Transcribes an audio file at the given path to text and writes the transcribed text to the output file.
    """
    wav_file = prepare_voice_file(input_path)
    with sr.AudioFile(wav_file) as source:
        audio_data = sr.Recognizer().record(source, duration=30)  # Record for 30 seconds
        text = transcribe_with_google_speech(audio_data, language)
        write_transcription_to_file(text, output_path)
        print('Transcription:')
        print(text)


def extract_video_id(url: str) -> Optional[str]:
    """Extract YouTube video ID from various URL formats."""
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/)([^&\n?#]+)',
        r'youtube\.com/embed/([^&\n?#]+)',
        r'youtube\.com/v/([^&\n?#]+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    return None


def format_timestamp(seconds: float) -> str:
    """Convert seconds to HH:MM:SS format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"


def get_transcript_data(video_id: str):
    """Get transcript data for a video."""
    try:
        # Create an instance and use the fetch method
        api = YouTubeTranscriptApi()
        transcript = api.fetch(video_id, languages=('en',))
        
        # Convert FetchedTranscriptSnippet objects to dictionaries
        transcript_data = []
        for item in transcript:
            transcript_data.append({
                'text': item.text,
                'start': item.start,
                'duration': item.duration
            })
        
        return transcript_data
    except (TranscriptsDisabled, NoTranscriptFound):
        return None
    except Exception as e:
        print(f"Error getting transcript: {e}")
        return None


@app.route('/api/transcribe-audio', methods=['POST'])
def api_transcribe_audio():
    """Web API endpoint to transcribe audio file."""
    temp_file_path = None
    try:
        # Check if file is in request
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        
        file = request.files['audio']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': f'File type not allowed. Allowed types: {", ".join(sorted(ALLOWED_EXTENSIONS))}'}), 400
        
        print(f"\n=== Audio Transcription Request ===")
        print(f"Received audio file: {file.filename}")
        print(f"Content type: {file.content_type}")
        
        # Get file extension
        filename = secure_filename(file.filename)
        file_ext = os.path.splitext(filename)[1] or '.webm'
        
        # Read file directly into memory
        audio_bytes = file.read()
        print(f"Audio bytes read: {len(audio_bytes)}")
        
        if len(audio_bytes) == 0:
            return jsonify({'error': 'Uploaded file is empty'}), 400
        
        # Save to temporary file for Whisper with proper extension
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext, mode='wb') as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
            temp_file.flush()
            os.fsync(temp_file.fileno())
        
        print(f"Temp file created: {temp_file_path}")
        print(f"Temp file size: {os.path.getsize(temp_file_path)} bytes")
        print(f"Temp file exists: {os.path.exists(temp_file_path)}")
        
        # Verify the file was written correctly
        if not os.path.exists(temp_file_path):
            return jsonify({'error': 'Failed to create temporary file'}), 500
        
        if os.path.getsize(temp_file_path) == 0:
            return jsonify({'error': 'Temporary file is empty'}), 500
        
        # Transcribe the audio file
        transcript_data = transcribe_audio_file(temp_file_path)
        
        if transcript_data is None:
            return jsonify({
                'filename': file.filename,
                'transcripts': [],
                'totalSegments': 0,
                'message': 'Failed to transcribe audio file - Whisper returned no results'
            }), 500
        
        if len(transcript_data) == 0:
            return jsonify({
                'filename': file.filename,
                'transcripts': [],
                'totalSegments': 0,
                'message': 'No speech detected in audio file'
            }), 200
        
        print(f"Successfully transcribed {len(transcript_data)} segments")
        print(f"=== Transcription Complete ===\n")
        
        return jsonify({
            'filename': file.filename,
            'transcripts': transcript_data,
            'totalSegments': len(transcript_data)
        })
        
    except Exception as e:
        print(f"\n!!! Audio transcription API Error !!!")
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'error': 'Failed to transcribe audio',
            'details': str(e)
        }), 500
        
    finally:
        # Clean up temporary file
        if temp_file_path:
            try:
                if os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    print(f"Cleaned up temp file: {temp_file_path}")
            except Exception as cleanup_error:
                print(f"Failed to cleanup temp file: {cleanup_error}")


# -------------------------------------------------
# API: Google Speech Recognition
# -------------------------------------------------
@app.route("/api/transcribe-google", methods=["POST"])
def api_transcribe_google():
    """Web API endpoint to transcribe audio using Google Speech Recognition."""
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400
        
        file = request.files["audio"]
        
        if file.filename == "":
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({"error": "Unsupported audio format"}), 400
        
        print(f"🎤 Google Speech Recognition: {file.filename}")
        
        # Read file directly into memory
        audio_bytes = file.read()
        
        if len(audio_bytes) == 0:
            return jsonify({"error": "Uploaded file is empty"}), 400
        
        # Save to temporary file for Google Speech
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(audio_bytes)
            temp_file_path = temp_file.name
        
        try:
            # Convert to WAV format if needed
            wav_path = prepare_voice_file(temp_file_path)
            
            # Transcribe using Google Speech Recognition
            with sr.AudioFile(wav_path) as source:
                audio_data = sr.Recognizer().record(source, duration=30)
                text = transcribe_with_google_speech(audio_data)
            
            if text.startswith("Google Speech Recognition") or text.startswith("Speech recognition error"):
                return jsonify({
                    "filename": file.filename,
                    "transcripts": [],
                    "totalSegments": 0,
                    "message": text
                }), 500
            
            # Create transcript segments
            transcript_data = [{
                "text": text.strip(),
                "start": 0.0,
                "duration": 30.0
            }]
            
            print(f"✅ Google Speech Recognition completed: {len(text)} characters")
            
            return jsonify({
                "filename": file.filename,
                "transcripts": transcript_data,
                "totalSegments": len(transcript_data),
                "method": "Google Speech Recognition"
            })
            
        finally:
            # Clean up temporary files
            for temp_path in [temp_file_path, wav_path]:
                try:
                    if os.path.exists(temp_path):
                        os.unlink(temp_path)
                        print(f"Cleaned up: {temp_path}")
                except:
                    pass
        
    except Exception as e:
        print(f"❌ Google Speech Recognition Error: {e}")
        return jsonify({
            "error": "Failed to transcribe audio",
            "details": str(e)
        }), 500


@app.route('/api/transcript', methods=['POST'])
def api_get_transcript():
    """Web API endpoint to get transcript."""
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'YouTube URL is required'}), 400
        
        video_id = extract_video_id(url) or url
        
        if not video_id:
            return jsonify({'error': 'Invalid YouTube URL'}), 400
        
        print(f"Processing video ID: {video_id}")
        
        # Get transcript data
        transcript_data = get_transcript_data(video_id)
        
        if not transcript_data:
            return jsonify({
                'videoId': video_id,
                'transcripts': [],
                'totalSegments': 0,
                'message': 'No captions available for this video'
            })
        
        print(f"Successfully retrieved {len(transcript_data)} transcript items")
        
        # Combine all transcripts into a single text block (User requested "no time line")
        full_text = " ".join([item['text'] for item in transcript_data])
        
        # Clean up whitespace
        full_text = " ".join(full_text.split())
        
        # Create a single segment containing the entire text
        segmented_transcripts = [{
            'start': 0,
            'end': transcript_data[-1]['start'] + transcript_data[-1]['duration'] if transcript_data else 0,
            'text': full_text
        }]
        
        return jsonify({
            'videoId': video_id,
            'transcripts': segmented_transcripts,
            'totalSegments': len(segmented_transcripts)
        })
        
    except Exception as e:
        print(f"API Error: {e}")
        return jsonify({
            'error': 'Failed to fetch transcript',
            'details': str(e)
        }), 500


@app.route('/api/summarize', methods=['POST'])
def api_summarize():
    """Generate generic summary using Groq."""
    try:
        # Check if Groq client is configured
        if not groq_client:
            return jsonify({
                'error': 'Groq API key not configured',
                'details': 'Please add GROQ_API_KEY to your .env file'
            }), 500
        
        data = request.get_json()
        transcript_text = data.get('transcript')
        
        if not transcript_text:
            return jsonify({'error': 'Transcript text is required'}), 400
            
        print("Generating summary with Groq...")
        
        system_prompt = r"""You are an expert academic summarizer.

You will be given the COMPLETE YouTube lecture transcript.
Your task is to rewrite it into ONE continuous, detailed summary
that faithfully covers EVERYTHING said in the lecture.

ABSOLUTE RULES:
1. Do NOT add headings, subheadings, bullet points, or lists.
2. Do NOT include sections like “key takeaways”, “summary”, or “conclusion”.
3. Do NOT invent, generalize, or abstract content.
4. Every idea in the output MUST come directly from the transcript.
5. Preserve the original order and logical flow of the lecture.

CONTENT RULES:
- Rewrite spoken language into clear academic prose.
- Remove filler words, repetitions, greetings, and pauses,
  but NEVER remove meaningful information.
- If the speaker explains something informally, rewrite it clearly
  without adding new information.
- If an idea is repeated, merge it naturally into one explanation.

SCIENTIFIC & TECHNICAL FORMATTING:
- Convert spoken mathematics into proper notation:
  - “x square” → \( x^2 \)
  - “log base 2 of n” → \( \log_2(n) \)
  - “big O of n log n” → \( O(n \log n) \)
- Preserve equations, formulas, and definitions exactly.
- Format any code or pseudo-code in fenced blocks.

ANTI-HALLUCINATION CHECK:
If the transcript lacks concrete educational content,
output ONLY:
"ERROR: Transcript does not contain sufficient information to generate a detailed lecture summary."

OUTPUT FORMAT:
- Plain text paragraphs only.
- No titles.
- No lists.
- No headings.
- Academic, neutral tone."""

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": system_prompt,
                },
                {
                    "role": "user",
                    "content": transcript_text,
                }
            ],
            model="llama-3.1-8b-instant",  # Faster model with higher rate limits
            temperature=0.5,
        )
        
        summary = chat_completion.choices[0].message.content
        print("Summary generated successfully")
        
        return jsonify({'summary': summary})
        
    except Exception as e:
        print(f"Summary Error: {e}")
        return jsonify({
            'error': 'Failed to generate summary',
            'details': str(e)
        }), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Python transcript server is running'})

@click.argument('input_path', type=click.Path(exists=True))
@click.option('--output', '-o', type=click.Path(), help='Output file path (default: stdout)')
@click.option('--timestamps/--no-timestamps', default=True, help='Include timestamps (default: True)')
@click.option('--method', type=click.Choice(['whisper', 'google']), default='whisper', help='Transcription method (whisper or google)')
def main(input_path: str, output: Optional[str], timestamps: bool, audio: Optional[bool], method: str) -> None:
    """Extract transcript from YouTube video or audio file.
    
    INPUT_PATH can be a YouTube URL, video ID, or path to audio file.
    """
    try:
        # Determine if input is YouTube URL or audio file
        is_audio = audio or (audio is None and (os.path.isfile(input_path) and not input_path.startswith(('http://', 'https://'))))
        
        if is_audio:
            # Handle audio file transcription
            if not allowed_file(input_path):
                click.echo("Error: Unsupported audio format. Allowed: mp3, wav, m4a, flac, ogg, aac, wma", err=True)
                sys.exit(1)
            
            click.echo(f"Transcribing audio file: {input_path}")
            
            if method == 'google':
                click.echo("🎤 Using Google Speech Recognition...")
                transcript_data = []
                wav_file = prepare_voice_file(input_path)
                
                with sr.AudioFile(wav_file) as source:
                    audio_data = sr.Recognizer().record(source, duration=30)
                    text = transcribe_with_google_speech(audio_data)
                    
                    if text.startswith("Google Speech Recognition") or text.startswith("Speech recognition error"):
                        click.echo("❌ Speech recognition failed", err=True)
                        sys.exit(1)
                    
                    # Create transcript segments
                    transcript_data.append({
                        'text': text.strip(),
                        'start': 0.0,
                        'duration': 30.0
                    })
                    
                    click.echo(f"✅ Google Speech Recognition completed: {len(text)} characters")
            else:
                # Use Whisper
                click.echo("🧠 Using Whisper...")
                transcript_data = transcribe_audio_file(input_path)
            
            if not transcript_data:
                click.echo("❌ Transcription failed", err=True)
                sys.exit(1)
        else:
            # Handle YouTube URL
            video_id = extract_video_id(input_path) or input_path
            api = YouTubeTranscriptApi()
            transcript = api.fetch(video_id, languages=('en',))
            
            # Convert to standard format
            transcript_data = []
            for entry in transcript:
                transcript_data.append({
                    'text': entry.text,
                    'start': entry.start,
                    'duration': entry.duration
                })
        
        # Format the transcript
        formatted_lines = []
        for entry in transcript_data:
            if timestamps:
                timestamp = format_timestamp(entry['start'])
                formatted_lines.append(f"[{timestamp}] {entry['text']}")
            else:
                formatted_lines.append(entry['text'])
        
        transcript_text = '\n'.join(formatted_lines)
        
        # Output handling
        if output:
            with open(output, 'w', encoding='utf-8') as f:
                f.write(transcript_text)
            click.echo(f"Transcript saved to: {output}")
        else:
            click.echo(transcript_text)
            
    except (TranscriptsDisabled, NoTranscriptFound):
        click.echo("Error: No transcript found for this video.", err=True)
        sys.exit(1)
    except Exception as e:
        click.echo(f"Error: {str(e)}", err=True)
        sys.exit(1)


# --- Note Management ---

NOTES_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'notes')
if not os.path.exists(NOTES_DIR):
    os.makedirs(NOTES_DIR)

@app.route('/api/notes', methods=['GET'])
def list_notes():
    """List all saved notes."""
    try:
        notes = []
        if os.path.exists(NOTES_DIR):
            files = sorted(os.listdir(NOTES_DIR), reverse=True)
            for filename in files:
                if filename.endswith('.txt'):
                    file_path = os.path.join(NOTES_DIR, filename)
                    stats = os.stat(file_path)
                    
                    # Read first line as title preview
                    title = filename
                    with open(file_path, 'r', encoding='utf-8') as f:
                        first_line = f.readline().strip()
                        if first_line:
                            title = first_line[:50] # truncated title
                            
                    notes.append({
                        'filename': filename,
                        'title': title,
                        'created_at': stats.st_ctime
                    })
        return jsonify({'notes': notes})
    except Exception as e:
        print(f"Error listing notes: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/notes', methods=['POST'])
def save_note():
    """Save a new note."""
    try:
        data = request.get_json()
        content = data.get('content')
        if not content:
            return jsonify({'error': 'Content is required'}), 400
            
        # Generate filename based on timestamp
        import datetime
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"note_{timestamp}.txt"
        file_path = os.path.join(NOTES_DIR, filename)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
            
        return jsonify({'message': 'Note saved', 'filename': filename})
    except Exception as e:
        print(f"Error saving note: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/notes/<filename>', methods=['GET'])
def get_note(filename):
    """Get a specific note content."""
    try:
        if not allowed_file(filename) and not filename.endswith('.txt'):
             return jsonify({'error': 'Invalid filename'}), 400

        file_path = os.path.join(NOTES_DIR, secure_filename(filename))
        if not os.path.exists(file_path):
            return jsonify({'error': 'Note not found'}), 404
            
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        return jsonify({'content': content})
    except Exception as e:
        print(f"Error reading note: {e}")
        return jsonify({'error': str(e)}), 500


def run_server():
    """Run the Flask server."""
    print("🚀 Python transcript server running on http://localhost:3001")
    print("CLI Usage:")
    print("  YouTube: python transcript_api.py <youtube_url>")
    print("  Audio:   python transcript_api.py <audio_file.mp3> [--method=whisper|google]")
    print("API Usage:")
    print("  YouTube: POST to http://localhost:3001/api/transcript")
    print("  Audio (Whisper):   POST to http://localhost:3001/api/transcribe-audio")
    print("  Audio (Google):   POST to http://localhost:3001/api/transcribe-google")
    app.run(host='0.0.0.0', port=3001, debug=True)


if __name__ == '__main__':
    # Check if we're running as a server or CLI
    if len(sys.argv) > 1:
        main()
    else:
        run_server()
## AV Stumpfl Pixera JSON Api Rev367

Nativ implementation using Pixera JSON/TCP Api

### Actions
* Timeline Transport Mode
* Timeline NextCue
* Timeline PerviusCue
* Timeline IgnoreNextCueW
* Timeline Store
* Visible Screen On/Off
* Screen is Projectable On/Off
* Screen Trigger Mapping		
* Goto Timecode
* Goto Cue by Name
* Goto Cue by Index
* Blend to Timecode
* Blend to Cue by Name
* Blend to Next Cue
* Blend to Prev Cue
* Timeline Opacity				
* Timeline SMPTE Mode				
* Timeline Fade Opacity			(StartOpacityAnimation)
* Layer Reset
* Layer Mute/VolumeMute
* Layer Paramter
* Control Action
* API (e.g. {"jsonrpc":"2.0", "id":9, "method":"Pixera.Compound.startFirstTimeline"})

### Feedback
* Button Color Timeline State
* Button Text Timeline Timecode
* Button Text Timeline Remain
* Button Color Selected Timeline State
* Button Text Selected Timeline Timecode
* Button Text Selected Timeline Remain

### Variables

Per-timeline variables:

| Variable | Description |
|---|---|
| `$(pixera:timeline_HANDLE_name)` | Timeline name |
| `$(pixera:timeline_HANDLE_state)` | Transport state (1=play, 2=pause, 3=stop) |
| `$(pixera:timeline_HANDLE_state_text)` | Transport state as text |
| `$(pixera:timeline_HANDLE_position)` | Position in frames |
| `$(pixera:timeline_HANDLE_position_timecode)` | Position as HH:MM:SS:FF |
| `$(pixera:timeline_HANDLE_countdown)` | Remaining time in frames |
| `$(pixera:timeline_HANDLE_countdown_timecode)` | Remaining time as HH:MM:SS:FF |
| `$(pixera:timeline_HANDLE_fps)` | Frames per second |

Selected timeline variables:

| Variable | Description |
|---|---|
| `$(pixera:timeline_selected_handle)` | Handle of the selected timeline |
| `$(pixera:timeline_selected_name)` | Name of the selected timeline |
| `$(pixera:timeline_selected_state)` | Transport state (numeric) |
| `$(pixera:timeline_selected_state_text)` | Transport state as text |
| `$(pixera:timeline_selected_position_timecode)` | Position as HH:MM:SS:FF |
| `$(pixera:timeline_selected_countdown_timecode)` | Remaining time as HH:MM:SS:FF |



### Presets

Ready-to-use button presets are automatically generated for every timeline loaded from Pixera:

**Selected Timeline** – Transport (Play/Pause/Stop/Toggle), Cue Navigation, Fade, Timecode/Countdown display
**Timeline: \<Name\>** – Same set per timeline, plus a Select button


### Response
* API Commands returns Handles if available
* some commands are only workig in version 2.0
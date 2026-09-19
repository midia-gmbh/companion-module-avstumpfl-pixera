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
* Goto Cue by Name (timeline dropdown + cue dropdown, free text still possible)
* Goto Cue by Index
* Blend to Timecode
* Blend to Cue by Name (timeline dropdown + cue dropdown, free text still possible)
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
* Button Color when Cue is the current Cue
* Button Color when Cue is the next Cue

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
| `$(pixera:timeline_HANDLE_countdown_reason)` | `next_cue` or `cue_wait` |

Cue variables – available per timeline (`timeline_HANDLE_…`) and for the selected timeline
(`timeline_selected_…`). `ROLE` is one of `cue_current`, `cue_next` or `cue_prev`:

| Variable | Description |
|---|---|
| `$(pixera:timeline_HANDLE_cue_count)` | Number of cues on the timeline |
| `$(pixera:timeline_HANDLE_ROLE_name)` | Cue name – unnamed cues show their cue number |
| `$(pixera:timeline_HANDLE_ROLE_index)` | Chronological index of the cue |
| `$(pixera:timeline_HANDLE_ROLE_number)` | Cue number as shown in Pixera (e.g. `1.2`) |
| `$(pixera:timeline_HANDLE_ROLE_time)` | Cue time in frames |
| `$(pixera:timeline_HANDLE_ROLE_time_timecode)` | Cue time as HH:MM:SS:FF |
| `$(pixera:timeline_HANDLE_cue_next_remaining)` | Frames until the next cue |
| `$(pixera:timeline_HANDLE_cue_next_remaining_timecode)` | Time until the next cue as HH:MM:SS:FF |

The *next cue* follows the timeline countdown rather than the cue order: while the timeline
counts down towards a cue, the cue at that time is reported. Cues set to **Exclude Cue from
Countdown** in Pixera are therefore skipped, matching what the countdown shows. When no cue
countdown is running, the chronologically next cue is reported. This behaviour can be turned
off with **Next cue follows countdown** in the instance configuration.

Cues are read once per connect and then kept in sync through the `cueAdded`, `cueChanged`,
`cueRemoved` and `cueApplied` monitoring subjects. Like position and countdown, these live
updates require **polling** to be enabled in the instance configuration.

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

**Selected Timeline** – Transport (Play/Pause/Stop/Toggle), Cue Navigation (jump and blend), Cue Info, Fade, Timecode/Countdown display
**Timeline: \<Name\>** – Same set per timeline, plus a Select button, one *Goto* and one *Blend* button per cue (first 128 cues)

Blend presets use the **Default Blendtime** from the instance configuration. It only pre-fills
the field, every action keeps its own editable blendtime.


### Response
* API Commands returns Handles if available
* some commands are only workig in version 2.0
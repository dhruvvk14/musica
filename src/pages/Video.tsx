import { OpennoteClient } from '@opennote-ed/sdk';

const client = new OpennoteClient('your_editable_api_key');

// Create a video from a simple prompt
const response = await client.video.create({
    model: "picasso",
    messages: [
        { role: "system", content: "Create educational content for high school students" },
        { role: "user", content: "Explain photosynthesis in plants with visual examples" }
    ],
    title: "Photosynthesis in Plants",
    upload_to_s3: true,
    include_sources: true,
    search_for: "plant photosynthesis biology",
    source_count: 3
});

if (response.success && response.video_id) {
    console.log(`Video creation started! ID: ${response.video_id}`);
    
    // Poll for completion
    while (true) {
        const status = await client.video.status(response.video_id);
        console.log(`Status: ${status.status} (${status.progress}%)`);
        
        if (status.status === "completed" && status.response?.s3_url) {
            console.log(`Video ready: ${status.response.s3_url}!`);
            break;
        } else if (status.status === "failed") {
            console.error(`ERROR, Video creation failed: ${status.message}`);
            break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 15000));
    }
}
import { OpennoteClient } from '@opennote-ed/sdk';
const client = new OpennoteClient('sk_opennote_0ee0c60b-3c85-420a-8378-5949eedf734f');

async function createEducationalVideo(topic: string, description: string) {
    const response = await client.video.create({
        model: "picasso",
        messages: [
            { role: "system", content: "Create educational content for high school students" },
            { role: "user", content: `Explain ${topic} with visual examples` }
        ],
        title: description,
        upload_to_s3: true,
        include_sources: true,
        search_for: `${topic} education diagram`,
        source_count: 3
    });

    if (!response.success || !response.video_id) throw new Error("Failed to create video");

    console.log(`Video creation started! ID: ${response.video_id}`);

    while (true) {
        const status = await client.video.status(response.video_id);
        console.log(`Status: ${status.status} (${status.progress}%)`);

        if (status.status === "completed" && status.response?.s3_url) {
            console.log(`Video ready: ${status.response.s3_url}!`);
            return status.response.s3_url;
        } else if (status.status === "failed") {
            throw new Error(`Video creation failed: ${status.message}`);
        }

        await new Promise(resolve => setTimeout(resolve, 15000));
    }
}

// Usage
// const videoUrl = await createEducationalVideo("photosynthesis", "Photosynthesis in Plants");

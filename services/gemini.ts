import { GoogleGenAI, Type } from "@google/genai";
import { Course } from "../types";

// Schema definition for the model
const responseSchema = {
  type: Type.OBJECT,
  properties: {
    courses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Course name" },
          teacher: { type: Type.STRING, description: "Teacher name (optional)" },
          location: { type: Type.STRING, description: "Classroom or location (optional)" },
          dayOfWeek: { type: Type.INTEGER, description: "Day of week: 1 for Monday, 7 for Sunday" },
          startTime: { type: Type.STRING, description: "Start time in HH:MM 24h format (e.g. '08:00')" },
          endTime: { type: Type.STRING, description: "End time in HH:MM 24h format (e.g. '09:35')" },
          weeks: { type: Type.STRING, description: "Week range string, e.g., '1-16', '1-17单', '2-8,10' without brackets" }
        },
        required: ["name", "dayOfWeek", "startTime", "endTime", "weeks"],
      },
    },
  },
};

export const parseScheduleImage = async (base64Image: string): Promise<Course[]> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Remove data URL header if present
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg", // Assuming JPEG for simplicity, usually fine
              data: cleanBase64,
            },
          },
          {
            text: `Analyze this class schedule image carefully. It is a Chinese university timetable.
            
            Key extraction rules:
            1. **Split Mixed Cells**: If a single grid cell contains multiple courses (e.g., separated by horizontal lines or different weeks like "1-8 weeks Course A" and "9-16 weeks Course B"), create SEPARATE course entries for each.
            2. **Parse Text Format**: Cells often follow format: "CourseName TeacherName [Weeks] Location". 
               - Extract 'weeks' from brackets like [1-16] or (1-16) or {1-16}. 
               - If weeks text contains "单" (odd) or "双" (even), include that char (e.g., "1-17单").
               - If no weeks are specified, default to "1-16".
            3. **Location Cleaning**: The character '周' (Week) often appears as a suffix to the week range (e.g., '[1-16]周') or immediately before the location. 
               - **CRITICAL**: Do NOT include the character '周' in the \`location\` field.
               - Example: Text is "Math [1-16]周正心209". Extracted location must be "正心209", NOT "周正心209".
               - Example: Text is "Physics [2-8]周 正心201". Location is "正心201".
            4. **Day & Time**: 
               - Convert columns to dayOfWeek (Monday=1...Sunday=7).
               - Rows usually represent class periods (1-2, 3-4 etc.). Map these to time ranges. 
                 - Standard ref: 
                   Period 1-2 (08:00-09:45)
                   Period 3-4 (10:00-11:45)
                   Period 5-6 (13:45-15:30)
                   Period 7-8 (15:45-17:30)
                   Period 9-10 (18:30-20:15)
                   Period 11 (20:30-21:20)
                   Period 12 (21:25-22:15)
                 - Prefer times written in the image.
            
            Return valid JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const data = JSON.parse(text);
    
    // Add unique IDs to the courses for React rendering
    const coursesWithIds = (data.courses || []).map((c: any) => {
      let loc = c.location || '';
      // Post-processing cleanup: Remove leading '周' if present
      if (loc.startsWith('周')) {
        loc = loc.substring(1).trim();
      }

      return {
        ...c,
        id: Math.random().toString(36).substr(2, 9),
        // Fallbacks
        teacher: c.teacher || '',
        location: loc,
        startTime: c.startTime || '08:00',
        endTime: c.endTime || '09:30', 
        weeks: c.weeks || '1-16',
      };
    });

    return coursesWithIds;
  } catch (error) {
    console.error("Gemini Parse Error:", error);
    throw error;
  }
};
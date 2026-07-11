import axiosInstance from "../utils/axiosInstance";
import { BASE_URL } from "../utils/apiPaths";

const PODCAST_API = '/podcasts';

export const generatePodcast = async (documentId, options = {}) => {
  try {
    const response = await axiosInstance.post(`${PODCAST_API}/generate`, {
      documentId,
      ...options,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to generate podcast" };
  }
};

export const getPodcasts = async (documentId) => {
  try {
    const response = await axiosInstance.get(`${PODCAST_API}/document/${documentId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch podcasts" };
  }
};

export const getPodcastById = async (podcastId, options = {}) => {
  try {
    const response = await axiosInstance.get(`${PODCAST_API}/${podcastId}`, options);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to fetch podcast details" };
  }
};

export const addBookmark = async (podcastId, timestamp, note) => {
  try {
    const response = await axiosInstance.post(`${PODCAST_API}/${podcastId}/bookmarks`, {
      timestamp,
      note
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: "Failed to add bookmark" };
  }
};

export const getAudioUrl = (podcastId, chapterIndex) => {
    return `${BASE_URL}/api${PODCAST_API}/${podcastId}/audio/${chapterIndex}`;
};

export const getAudioBlob = async (podcastId, chapterIndex, options = {}) => {
    try {
        const response = await axiosInstance.get(`${PODCAST_API}/${podcastId}/audio/${chapterIndex}`, {
            responseType: 'blob',
            ...options
        });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch audio" };
    }
};

export const getJob = async (jobId) => {
    try {
        const response = await axiosInstance.get(`${PODCAST_API}/jobs/${jobId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to fetch job" };
    }
};

export const retryJob = async (jobId) => {
    try {
        const response = await axiosInstance.post(`${PODCAST_API}/jobs/${jobId}/retry`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to retry job" };
    }
};

export const retryChapterAudio = async (podcastId, chapterIndex) => {
    try {
        const response = await axiosInstance.post(`${PODCAST_API}/${podcastId}/audio/${chapterIndex}/retry`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to retry chapter audio" };
    }
};

const podcastService = {
  generatePodcast,
  getPodcasts,
  getPodcastById,
  addBookmark,
  getAudioUrl,
  getAudioBlob,
  getJob,
  retryJob,
  retryChapterAudio
};

export default podcastService;

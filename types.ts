
export type ParticipantType = 
  | 'Boy' 
  | 'Girl' 
  | 'AdultMale' 
  | 'AdultFemale' 
  | 'Person' 
  | 'LittlePerson';

export interface Participant {
  id: string;
  name: string;
  type: ParticipantType;
}

export interface PoseImage {
  id: string;
  url: string;
  thumbnail: string;
  sourceUrl: string;
  title: string;
  author?: string;
}

export interface DrawingEvaluation {
  id: string;
  poseId: string;
  participantId: string;
  score: number;
  feedback: string;
  drawingThumbnail: string;
}

export enum SessionState {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  PAUSED = 'PAUSED',
  LOADING = 'LOADING',
  FINISHED = 'FINISHED'
}

export interface AppSettings {
  searchRefinement: string;
  enableRoast: boolean;
  evaluationFocus: 'Gesture' | 'Proportion' | 'Anatomy';
}

export interface SessionConfig {
  intervalSeconds: number;
  totalImages: number;
  category: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

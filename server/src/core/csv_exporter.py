import csv
from typing import Dict, List
import io
from datetime import datetime
import numpy as np

class CSVExporter:
    def __init__(self):
        self.session_data = None

    def export_session(self, session_data: Dict) -> str:
        """Export session data to CSV format"""
        try:
            self.session_data = session_data
            output = io.StringIO()
            writer = csv.writer(output, quoting=csv.QUOTE_MINIMAL)

            self._write_session_info(writer)
            writer.writerow([])

            self._write_analytics(writer)
            writer.writerow([])

            self._write_gaze_data(writer)

            return output.getvalue()
        except Exception as e:
            print(f"❌ CSV Export Error: {e}")
            return ""

    def _write_session_info(self, writer: csv.writer):
        """Write session metadata"""
        writer.writerow(['# Session Information'])
        writer.writerow(['Experiment Name', self.session_data["experiment_name"]])
        writer.writerow(['Participant ID', self.session_data["participant_id"]])
        writer.writerow(['Start Time', self.session_data["start_time"]])

    def _write_analytics(self, writer: csv.writer):
        """Write analytics summary"""
        writer.writerow(['# Analytics'])
        writer.writerow(['Total Gaze Points', self.session_data["analytics"]["total_gaze_points"]])
        writer.writerow(['Average Confidence', self.session_data["analytics"]["average_confidence"]])

    def _write_gaze_data(self, writer: csv.writer):
        """Write gaze data with movement analysis"""
        writer.writerow(['# Gaze Data'])
        writer.writerow(['Timestamp', 'X', 'Y', 'Pupil Size', 'Fixation', 'Saccade'])

        gaze_data = self.session_data["gaze_data"]
        timestamps = [data["timestamp"] for data in gaze_data]
        x_positions = [data["x"] for data in gaze_data]
        y_positions = [data["y"] for data in gaze_data]
        pupil_sizes = [data.get("pupil_size", None) for data in gaze_data]

        # Compute fixations and saccades
        distances = np.sqrt(np.diff(x_positions, prepend=x_positions[0])**2 + 
                            np.diff(y_positions, prepend=y_positions[0])**2)
        FIXATION_THRESHOLD = 30
        movement_types = ["Fixation" if d < FIXATION_THRESHOLD else "Saccade" for d in distances]

        for i, data in enumerate(gaze_data):
            writer.writerow([
                timestamps[i], x_positions[i], y_positions[i], pupil_sizes[i], movement_types[i]
            ])
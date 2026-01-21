-- Clean up demo/simulated test data entries
DELETE FROM test_results WHERE error_message LIKE '%Simulated test failure for demo%';
DELETE FROM test_results WHERE test_name LIKE '%demo%';
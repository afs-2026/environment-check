package training.environment;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class EnvironmentController {
    private final ProbeRepository repository;
    public EnvironmentController(ProbeRepository repository) { this.repository = repository; }
    @GetMapping("/api/environment")
    public Map<String, String> check() {
        repository.saveAndFlush(new Probe(1L, "ready"));
        String result = repository.findById(1L).orElseThrow().getResult();
        if (!"ready".equals(result)) throw new IllegalStateException("H2 read-back failed");
        return Map.of("status", result, "database", "H2");
    }
}

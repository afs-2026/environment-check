package training.environment;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;

@Entity
public class Probe {
    @Id private Long id;
    private String result;
    protected Probe() {}
    public Probe(Long id, String result) { this.id = id; this.result = result; }
    public String getResult() { return result; }
}

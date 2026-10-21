package training.environment;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class EnvironmentTest {
    @Autowired EnvironmentController controller;
    @Test void storesAndReadsThroughH2() {
        assertEquals("ready", controller.check().get("status"));
        assertEquals("H2", controller.check().get("database"));
    }
}

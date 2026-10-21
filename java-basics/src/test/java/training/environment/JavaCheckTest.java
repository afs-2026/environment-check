package training.environment;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

class JavaCheckTest {
    @Test void compilesAndRunsWithJUnit() {
        assertEquals("Java ready", JavaCheck.status());
        assertEquals(21, Runtime.version().feature());
    }
}
